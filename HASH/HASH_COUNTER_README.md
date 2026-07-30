# SHA-256 Hash-Chained Counter

This is a small local counter that creates a tamper-evident chain of records.

## Start with Tyler's current count

```bash
python3 hash_counter.py add 670 --note "Counter initialized"
```

## Add the next value

```bash
python3 hash_counter.py add 671
```

## Verify the full chain

```bash
python3 hash_counter.py verify
```

## Display the entries

```bash
python3 hash_counter.py show
```

The data is stored in `counter_log.json`.

## What this proves

It can reveal whether an older record was edited, reordered, or removed.

It does **not** independently prove:

- that the count was accurate when entered;
- that the timestamp reflects the real-world event;
- who entered the record.

For stronger provenance, periodically copy the latest hash to a separate location:

- email it to yourself;
- send it in a message;
- commit it to a private Git repository;
- print it in a dated notebook.

Keep medical details out of the note field unless Tyler explicitly wants them stored.
