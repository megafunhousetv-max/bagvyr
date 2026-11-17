import contextlib
import datetime as dt
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request

import zstandard


UTC = dt.timezone.utc
BASE = "https://replay.shrine.trade/pump"
SOURCE = "Shrine.trade hourly archive"

ADDRESS = re.compile(
    r"^[1-9A-HJ-NP-Za-km-z]{32,44}$"
)

SIGNATURE = re.compile(
    r"^[1-9A-HJ-NP-Za-km-z]{64,88}$"
)

HOUR = re.compile(
    r"^\d{4}/\d{2}/\d{2}/\d{2}$"
)


class NotAvailable(Exception):
    pass


def iso(seconds):
    return (
        dt.datetime.fromtimestamp(seconds, UTC)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )


def hour_date(hour):
    if not HOUR.fullmatch(hour):
        raise ValueError("Invalid UTC archive hour")

    return dt.datetime.strptime(
        hour,
        "%Y/%m/%d/%H"
    ).replace(tzinfo=UTC)


def next_hour(hour):
    return (
        hour_date(hour) + dt.timedelta(hours=1)
    ).strftime("%Y/%m/%d/%H")


def uint(value, field):
    if (
        isinstance(value, bool)
        or not re.fullmatch(r"\d+", str(value))
    ):
        raise ValueError("Invalid " + field)

    return int(value)


def amount(raw, decimals):
    text = str(
        uint(raw, "tokenAmountRaw")
    ).zfill(decimals + 1)

    if decimals == 0:
        return text

    return (
        text[:-decimals]
        + "."
        + text[-decimals:]
    )


def request_json(
    url,
    method="GET",
    data=None,
    headers=None
):
    payload = (
        None
        if data is None
        else json.dumps(data).encode()
    )

    hdr = {
        "Accept": "application/json",
        "User-Agent": "RugInspect-archive/1.0"
    }

    hdr.update(headers or {})

    if payload is not None:
        hdr["Content-Type"] = "application/json"

    req = urllib.request.Request(
        url,
        data=payload,
        method=method,
        headers=hdr
    )

    try:
        with urllib.request.urlopen(
            req,
            timeout=30
        ) as response:
            content = response.read()

            return (
                json.loads(content)
                if content
                else None
            )

    except urllib.error.HTTPError as error:
        raise RuntimeError(
            "HTTP "
            + str(error.code)
            + " from "
            + urllib.parse.urlsplit(url).hostname
        ) from None


class Database:
    def __init__(self):
        self.base = os.environ.get(
            "SUPABASE_URL",
            ""
        ).rstrip("/")

        key = os.environ.get(
            "SUPABASE_SERVICE_ROLE_KEY",
            ""
        )

        if (
            not self.base.startswith("https://")
            or not key
        ):
            raise ValueError(
                "Missing SUPABASE_URL or "
                "SUPABASE_SERVICE_ROLE_KEY"
            )

        self.headers = {
            "apikey": key,
            "Authorization": "Bearer " + key
        }

    def call(
        self,
        table,
        method="GET",
        data=None,
        **params
    ):
        return request_json(
            self.base
            + "/rest/v1/"
            + table
            + "?"
            + urllib.parse.urlencode(params),
            method,
            data,
            self.headers
        )

    def get(self, mint):
        rows = self.call(
            "ri_early_archive",
            mint="eq." + mint,
            select="payload",
            limit=1
        )

        return rows[0]["payload"] if rows else None

    def save(self, payload):
        return self.call(
            "rpc/ri_early_archive_store",
            "POST",
            {
                "p_mint": payload["contract"],
                "p_payload": payload
            }
        )

    def job(
        self,
        mint,
        attempts,
        status,
        error=None
    ):
        self.call(
            "ri_early_archive_jobs",
            "PATCH",
            {
                "status": status,
                "attempts": attempts,
                "next_attempt_at": iso(
                    time.time() + 900
                ),
                "last_error": error
            },
            mint="eq." + mint
        )


def metadata_hour(mint):
    # Binance only locates the launch hour.
    # Buyers and launch metadata come from Shrine.
    query = urllib.parse.urlencode({
        "chainId": "CT_501",
        "contractAddress": mint
    })

    meta = request_json(
        "https://web3.binance.com/bapi/defi/v1/public/"
        "wallet-direct/buw/wallet/dex/market/"
        "token/meta/info/ai?"
        + query
    )

    data = meta.get("data") or {}

    if (
        str(meta.get("code")) != "000000"
        or meta.get("success") is False
    ):
        raise ValueError(
            "Token launch-hour metadata unavailable"
        )

    if data.get("contractAddress") not in (
        None,
        mint
    ):
        raise ValueError(
            "Token metadata contract mismatch"
        )

    milliseconds = uint(
        data.get("createTime"),
        "createTime"
    )

    if not (
        1500000000000
        < milliseconds
        <= int(time.time() * 1000)
    ):
        raise ValueError(
            "Invalid token launch time"
        )

    return dt.datetime.fromtimestamp(
        milliseconds / 1000,
        UTC
    ).strftime("%Y/%m/%d/%H")


def archive_index():
    result = request_json(
        BASE + "/index.json"
    )

    hours = result.get("hours")

    if (
        not isinstance(hours, list)
        or not hours
        or not all(
            isinstance(hour, str)
            and HOUR.fullmatch(hour)
            for hour in hours
        )
    ):
        raise ValueError(
            "Invalid Shrine archive index"
        )

    return set(hours)


@contextlib.contextmanager
def events_from(path_or_url):
    remote = str(path_or_url).startswith(
        "https://"
    )

    req = (
        urllib.request.Request(
            str(path_or_url),
            headers={
                "User-Agent":
                    "RugInspect-archive/1.0"
            }
        )
        if remote
        else None
    )

    with (
        urllib.request.urlopen(
            req,
            timeout=180
        )
        if remote
        else open(path_or_url, "rb")
    ) as compressed:

        def generate():
            decoder = (
                zstandard.ZstdDecompressor()
                .decompressobj()
            )

            pending = b""
            frame_complete = False

            while chunk := compressed.read(65536):
                while chunk:
                    if frame_complete:
                        decoder = (
                            zstandard
                            .ZstdDecompressor()
                            .decompressobj()
                        )

                    pending += decoder.decompress(
                        chunk
                    )

                    frame_complete = decoder.eof

                    chunk = (
                        decoder.unused_data
                        if frame_complete
                        else b""
                    )

                    while b"\n" in pending:
                        line, pending = pending.split(
                            b"\n",
                            1
                        )

                        event = json.loads(line)

                        if not isinstance(event, dict):
                            raise ValueError(
                                "Invalid archive event"
                            )

                        yield event

                    if len(pending) > 8 * 1024 * 1024:
                        raise ValueError(
                            "Archive JSON line is too large"
                        )

            if not frame_complete:
                raise ValueError(
                    "Truncated compressed archive"
                )

            if pending.strip():
                event = json.loads(pending)

                if not isinstance(event, dict):
                    raise ValueError(
                        "Invalid archive event"
                    )

                yield event

        yield generate()


class Launch:
    def __init__(self, mint, prior=None):
        if not ADDRESS.fullmatch(mint):
            raise ValueError("Invalid mint")

        self.mint = mint
        self.create = None
        self.buys = {}
        self.hours = []

        if prior:
            if (
                prior.get("contract") != mint
                or prior.get("source") != SOURCE
            ):
                raise ValueError(
                    "Invalid saved archive state"
                )

            state = prior["archive_state"]

            self.create = state["create"]
            self.hours = list(
                prior["archive_hours"]
            )

            self.buys = {
                row["wallet"]: row
                for row in state["first_buys"]
            }

    def feed(self, event):
        if event.get("mint") != self.mint:
            return

        if (
            event.get("action") == "create"
            and event.get("protocol") in (
                "PUMPFUN",
                "PUMPFUN_MAYHEM"
            )
        ):
            creator = event.get("creator", "")

            decimals = uint(
                event.get("decimals"),
                "decimals"
            )

            if (
                not ADDRESS.fullmatch(creator)
                or decimals > 30
            ):
                raise ValueError(
                    "Invalid launch metadata"
                )

            create = {
                "creator": creator,
                "decimals": decimals,

                "symbol": str(
                    event.get("symbol", "")
                )[:40],

                "timestamp": uint(
                    event.get("timestamp"),
                    "timestamp"
                ),

                "block": uint(
                    event.get("block"),
                    "block"
                ),

                "tx_index": uint(
                    event.get("txIndex"),
                    "txIndex"
                )
            }

            if (
                self.create
                and self.create != create
            ):
                raise ValueError(
                    "Conflicting launch metadata"
                )

            self.create = create

        legs = event.get("breakdown")

        if (
            event.get("action") in ("buy", "mixed")
            and not isinstance(legs, list)
        ):
            raise ValueError(
                "Buy event has no instruction breakdown"
            )

        if not isinstance(legs, list):
            return

        for index, leg in enumerate(legs):
            if leg.get("action") != "buy":
                continue

            wallet = leg.get("trader", "")
            signature = event.get("signature", "")

            if (
                not ADDRESS.fullmatch(wallet)
                or not SIGNATURE.fullmatch(signature)
            ):
                raise ValueError(
                    "Invalid buyer or transaction"
                )

            order = [
                uint(
                    event.get("block"),
                    "block"
                ),

                uint(
                    event.get("txIndex"),
                    "txIndex"
                ),

                uint(
                    leg.get("ixIndex"),
                    "ixIndex"
                ),

                (
                    -1
                    if leg.get("innerIndex") is None
                    else uint(
                        leg["innerIndex"],
                        "innerIndex"
                    )
                ),

                index
            ]

            raw = str(
                uint(
                    leg.get("tokenAmountRaw"),
                    "tokenAmountRaw"
                )
            )

            if raw == "0":
                continue

            row = {
                "wallet": wallet,
                "transaction": signature,
                "raw": raw,
                "order": order,

                "timestamp": uint(
                    event.get("timestamp"),
                    "timestamp"
                )
            }

            previous = self.buys.get(wallet)

            if (
                previous
                and previous["order"] == order
                and previous != row
            ):
                raise ValueError(
                    "Conflicting duplicate buy"
                )

            if (
                previous is None
                or row["order"] < previous["order"]
            ):
                self.buys[wallet] = row

                if len(self.buys) > 50:
                    last = max(
                        self.buys,
                        key=lambda key:
                            self.buys[key]["order"]
                    )

                    del self.buys[last]

    def finish_hour(self, hour):
        if (
            self.hours
            and hour != next_hour(self.hours[-1])
        ):
            raise NotAvailable(
                "Archive gap: "
                + next_hour(self.hours[-1])
            )

        self.hours.append(hour)

        if not self.create:
            raise NotAvailable(
                "Launch create event missing; "
                "launch hour may be wrong or unavailable"
            )

        start = [
            self.create["block"],
            self.create["tx_index"]
        ]

        if any(
            row["order"][:2] < start
            or row["timestamp"]
                < self.create["timestamp"]
            for row in self.buys.values()
        ):
            raise ValueError(
                "Buy precedes verified launch"
            )

    def payload(self):
        if not self.create:
            return None

        ordered = sorted(
            self.buys.values(),
            key=lambda row: row["order"]
        )

        buyers = [
            {
                "wallet": row["wallet"],

                "developer":
                    row["wallet"]
                    == self.create["creator"],

                "first_tokens": amount(
                    row["raw"],
                    self.create["decimals"]
                ),

                "first_at": iso(
                    row["timestamp"]
                ),

                "transaction":
                    row["transaction"]
            }
            for row in ordered
        ]

        return {
            "contract": self.mint,
            "source": SOURCE,
            "symbol": self.create["symbol"],
            "creator": self.create["creator"],
            "platform": "pump",

            "launch_at": iso(
                self.create["timestamp"]
            ),

            "buyers": buyers,

            "history_complete":
                len(buyers) == 50,

            "coverage":
                "provider_archive_launch_indexed",

            "archive_hours": self.hours,

            "chain_completeness_verified": False,

            "archive_state": {
                "create": self.create,
                "first_buys": ordered
            },

            "measured_at": iso(time.time())
        }


def scan_hour(
    hour,
    launches,
    local=None,
    failures=None
):
    source = (
        local
        or BASE + "/" + hour + ".jsonl.zst"
    )

    staged = {
        mint: (
            Launch(mint, obj.payload())
            if obj.create
            else Launch(mint)
        )
        for mint, obj in launches.items()
    }

    problems = {}

    with events_from(source) as events:
        for event in events:
            mint = event.get("mint")
            obj = staged.get(mint)

            if obj:
                try:
                    obj.feed(event)

                except Exception as error:
                    problems[mint] = error
                    del staged[mint]

    for mint, obj in list(staged.items()):
        try:
            obj.finish_hour(hour)

        except Exception as error:
            problems[mint] = error
            del staged[mint]

    if problems and failures is None:
        raise next(iter(problems.values()))

    if failures is not None:
        failures.update(problems)

    return staged


def run_jobs():
    db = Database()

    jobs = db.call(
        "ri_early_archive_jobs",
        status="eq.pending",

        next_attempt_at=(
            "lte." + iso(time.time())
        ),

        order="last_requested_at.desc",
        limit=10
    )

    if not jobs:
        print("No pending Early Buyers jobs")
        return

    available = archive_index()

    launches = {}
    schedules = {}
    active = {}

    for job in jobs:
        mint = job["mint"]
        attempts = job["attempts"] + 1

        try:
            prior = db.get(mint)

            if (
                prior
                and prior.get("history_complete")
                    is True
            ):
                db.job(
                    mint,
                    attempts,
                    "ready"
                )

                continue

            launches[mint] = Launch(
                mint,
                prior
            )

            hour = (
                next_hour(
                    prior["archive_hours"][-1]
                )
                if prior
                else metadata_hour(mint)
            )

            schedules[mint] = hour
            active[mint] = attempts

        except Exception as error:
            db.job(
                mint,
                attempts,
                "pending",
                str(error)[:250]
            )

            print(
                "Pending launch",
                mint,
                type(error).__name__
            )

    rounds = {
        mint: 0
        for mint in active
    }

    while active:
        hour = min(
            schedules[mint]
            for mint in active
        )

        group = {
            mint: launches[mint]
            for mint in active
            if schedules[mint] == hour
        }

        if hour not in available:
            for mint in group:
                old = hour < max(available)

                db.job(
                    mint,
                    active[mint],

                    (
                        "unavailable"
                        if old
                        else "pending"
                    ),

                    "Required archive hour "
                    "is not available: "
                    + hour
                )

                del active[mint]

            continue

        try:
            failures = {}

            staged = scan_hour(
                hour,
                group,
                failures=failures
            )

            for mint, error in failures.items():
                db.job(
                    mint,
                    active[mint],

                    (
                        "unavailable"
                        if isinstance(
                            error,
                            NotAvailable
                        )
                        else "pending"
                    ),

                    str(error)[:250]
                )

                del active[mint]

        except Exception as error:
            for mint in group:
                db.job(
                    mint,
                    active[mint],

                    (
                        "unavailable"
                        if isinstance(
                            error,
                            NotAvailable
                        )
                        else "pending"
                    ),

                    str(error)[:250]
                )

                del active[mint]

            print(
                "Archive processing failed",
                hour,
                type(error).__name__
            )

            continue

        for mint, obj in staged.items():
            launches[mint] = obj
            payload = obj.payload()

            if (
                payload
                and not db.save(payload)
            ):
                print(
                    "Discarded evicted coin",
                    mint
                )

                del active[mint]
                continue

            rounds[mint] += 1

            if (
                payload
                and payload["history_complete"]
            ):
                db.job(
                    mint,
                    active[mint],
                    "ready"
                )

                print(
                    "Saved",
                    mint,
                    "50 distinct launch buyers"
                )

                del active[mint]

            elif rounds[mint] >= 1:
                db.job(
                    mint,
                    active[mint],
                    "pending",

                    "Partial history; "
                    "next run will continue"
                )

                del active[mint]

            else:
                schedules[mint] = next_hour(
                    hour
                )


if __name__ == "__main__":
    run_jobs()
