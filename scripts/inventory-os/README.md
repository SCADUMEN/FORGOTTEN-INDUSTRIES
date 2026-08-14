# L'Inventaire / Le Laboratoire

FORGOTTEN INDUSTRIES
LOCAL OPERATOR INSTRUMENT // PRIVATE RUNTIME DATA

## Systems

- **L'INVENTAIRE — SYSTÈME DES OBJETS ET DES MOUVEMENTS** owns physical
  units, condition, location, cleaning, photography, listings, disposition,
  shipping, archive state, and per-item profit.
- **LE LABORATOIRE — SYSTÈME DE RECHERCHE ET DE DÉVELOPPEMENT** owns
  deployments, instruments, bench infrastructure, training, experiments,
  productive-capacity basis, intended profit pathways, and attributable
  realized return.

Both routes use one local data and API core. The separation is operational, not
duplicative: an object may move through L'Inventaire while a cleared resource
becomes productive capacity in Le Laboratoire.

## Principle

Master one SKU. Build the infrastructure. Generalize the system.

The M13 ammunition can is the calibration profile. The application core is not
ammo-can-specific: identifiers, lifecycle stages, audit records, photography,
listing copy, fulfillment, labels, and metrics remain stable when another SKU
profile is added.

## Run

Node 22 is the only runtime requirement.

```bash
node scripts/inventory-os/server.cjs
```

Open:

- <http://127.0.0.1:8093/inventory/> for L'Inventaire
- <http://127.0.0.1:8093/rd/> for Le Laboratoire

The server binds only to loopback. Runtime records and attached photographs are
written to `.tools/inventory-os/`, which is already excluded from Git. No
marketplace credentials, customer records, inventory locations, or raw images
enter the public archive.

To use another local port:

```bash
FI_INVENTORY_PORT=8094 node scripts/inventory-os/server.cjs
```

## Keyboard route

- `N`: register one item or a batch
- `/`: focus scan/search input
- `J` / `K`: move through visible records
- `Enter`: open the selected record
- USB/Bluetooth barcode or QR readers work as keyboard-wedge input in the search
  box; printed MVP labels use Code 39

Each item receives a non-reused `FI-INV-######` identifier. Printed ID labels
use Code 39 so the identifier can be scanned without a proprietary service.

## Lifecycle

```text
intake → inspection → cleaning → photography → storage → listing
       → published → sold → label → packing → shipped → archived
```

Transitions are operator-controlled and written to the audit log. The system
does not treat a listing as a sale or a sale as a shipment.

## Current instrument

- single-item and batch intake with unique per-unit IDs
- condition, location, cost, notes, and product-specific checklists
- local photograph attachment
- template-generated listing title and description
- manual marketplace/publication state
- cash, store-credit, trade, fee, shipping, and unresolved-financial states
- package dimensions, weight, carrier, tracking, and label reference
- printable 2.25 × 1.25 inch Code 39 inventory labels
- printable 4 × 6 inch packing records
- revenue, store-credit value, recognized profit, turnover, time-to-sell, and
  stage-duration metrics
- R+D deployment register separating cash from non-cash capacity, basis from
  realized return, and capability assets from training consumables
- silver-program register with elemental-Ag grams first, conditional gross
  mass, troy-ounce conversion, piece count, cleared coin-order basis, and an
  explicit physical-intake verification boundary
- CSV and JSON export
- atomic JSON persistence and full mutation audit

Marketplace publication is deliberately an adapter boundary. The MVP prepares
and records listings but does not silently operate seller accounts. Carrier
label purchasing is likewise external; the application records the carrier
label URL and prints the internal packing record.

## Authority boundary

The private SLUSH ledger remains the authority for cleared liquid movements.
Le Laboratoire records what cleared resources became: bench infrastructure,
capability assets, training consumables, pilot inventory, research objects, or
software/services. Capability is not cash, and hoped-for profit is not revenue.

Deployment basis is not future revenue. A profit pathway records the intended
commercial use; `realizedReturn` stays zero until cleared revenue can be linked
to that capacity. This is an operating record, not a tax classification.

Silver metrics are working inventory estimates, not assays or valuations.
Elemental-Ag grams remain primary; piece count, gross mass, and fine troy ounces
must stay labeled as conditional until receipt, order reconciliation, weighing,
and testing are recorded. Provisional wins may appear in the working count while
their uncleared hammer prices remain outside deployed basis.

## Add a SKU

Copy `profiles/m13-ammo-can.json`, assign a new profile ID and SKU, then replace
only:

- product name
- inspection/cleaning/photography/packing standards
- listing templates
- verified package defaults

Do not place inventory counts, buyer information, storage locations, serial
numbers, or unverified specifications in profile files. Profiles are reusable
process definitions; live objects belong in the ignored local register.

## Verify

```bash
node --check scripts/inventory-os/server.cjs
node --check scripts/inventory-os/public/app.js
npx vitest run tests/unit/inventory-os.test.js
```

Use targeted formatting while the repository contains unrelated working changes:

```bash
npx prettier --check scripts/inventory-os tests/unit/inventory-os.test.js
```
