# CaseLabs Mercury S8 + Pedestal Assembly Reference & Recovery Manual

## Manual Status

- Manual ID: `FI-TECH-REF-001`
- Shelf: `Hang On To Each Other`
- Object: CaseLabs Mercury S8 + pedestal
- Project link: `FI-PROJ-001`
- Status: integrated draft / bench verification required
- Source basis: recovered Manual 001 SLUSH draft, preserved PDF export, ExtremeRigs Mercury S8 review, embedded assembly timelapse, forum/build-log archaeology named in the draft, and local Forgotten Industries S8 restoration evidence
- Raw source draft: `intake/SLUSH/CaseLabs_Mercury_S8_Assembly_Reference_ForgottenIndustries.docx`
- Preserved reference artifacts:
  - `assets/reference/hang-on-to-each-other/caselabs-mercury-s8/CaseLabs_Mercury_S8_Manual_001_ForgottenIndustries.pdf`
  - `assets/reference/hang-on-to-each-other/caselabs-mercury-s8/caselabs-mercury-s8-assembly-timelapse-cpachris-ocn.gif`

## Purpose

This is the first Forgotten Industries technical manual: a recovered assembly
path for the CaseLabs Mercury S8 and pedestal.

CaseLabs closed in 2018. Official assembly documentation is not currently
present in the local archive. This manual exists because the machine still
deserves to be understood.

This is not yet a factory manual. It is a recovery manual: a careful record of
what can be observed, sourced, inferred, and verified before the physical
chassis is reassembled.

A thing documented is a thing not yet lost.

## Chassis Specifications

The CaseLabs Mercury S8 is a horizontal-ATX full-tower chassis manufactured by
CaseLabs in Canoga Park, Los Angeles, California. Production ran from
approximately 2014 to 2018, when the company closed. Existing units represent
the complete production run.

The S8 uses all-aluminum construction with removable panels, modular mounting
positions, and a removable motherboard tray. The pedestal is a separate
expansion unit that attaches beneath the main cube and provides additional
radiator, storage, cable-management, and PSU mounting capacity.

### Exterior Dimensions

- Height, main cube: 18.74 in / 476 mm
- Width: 14.54 in / 369 mm
- Depth: 19.03 in / 483 mm
- Weight, case only: 18.5 lb / 8.5 kg
- Rubber feet add: 0.75 in / 19 mm
- Standard casters add: 2.6 in / 67 mm
- Heavy-duty casters add: 3.0 in / 76 mm

### Motherboard Tray

- Standard tray dimensions: 12.38 in x 10.75 in / 315 mm x 273 mm
- Supported form factors: mATX, ATX, consumer E-ATX, SSI-CEB
- Confirmed compatible E-ATX boards: ASUS Rampage IV Extreme, ASUS Maximus V Formula, EVGA Z87 Classified
- Confirmed incompatible E-ATX class: Supermicro X7DAE and similar workstation E-ATX
- Optional upgrade: SSI-EEB tray
- Mounting method: slides into frame and secures with four screws
- Under-tray storage: 2x 3.5 in HDD or 4x 2.5 in SSD

The tray is externally removable. The motherboard, GPU, and expansion cards can
be assembled outside the case on the bench, then slid in as a unit. This is one
of the S8's strongest serviceability features. Use it.

VERIFY: If sourcing or fabricating a replacement tray, confirm whether the local
unit uses the standard ATX tray or the SSI-EEB upgrade tray. Measure the
existing tray opening before ordering or cutting anything.

### Expansion And Drive Capacity

- Expansion slots: 8
- Flex bays: 9x 5.25 in
- PSU mounts: 1 in main cube, with pedestal options
- Native HDD capacity: 4, plus 2 under the motherboard tray if SSD positions are sacrificed
- Maximum HDD capacity: 22
- Native SSD capacity: 4
- Maximum SSD capacity: 44
- Maximum listed radiator size: 120.3 / 360 mm

## Main Cube Internal Layout

The S8 main cube divides into functional chambers separated by the internal
divider/midplate. The visible component chamber carries the motherboard, GPU,
reservoir, pumps, and primary tubing. The opposite chamber carries the flex bay
column, HDD rack area, and secondary routing.

The top frame accepts drop-in radiator mounts. The rear accepts a single 120 mm
or 140 mm fan. The side chamber accepts a 360 mm or 240 mm radiator, depending
on local hardware and chamber configuration.

### Top Radiator Mounting

Drop-in radiator mounts are separate aluminum plates, approximately 0.090 in /
2.3 mm thick, that attach to the top frame. They allow radiators and fans to be
assembled outside the case and lowered in as a complete unit.

Known top options:

- 2x 360 mm drop-in mounts
- 2x 120 mm + 2x 140 mm alternative drop-in
- 2x 240 mm or 2x 280 mm alternative
- Integrated 2x 360 mm frame mount

For this build, dual 360 mm drop-in mounts remain the preferred serviceable
configuration.

### Side Radiator Mounting

The side position can accept a 360 mm or 240 mm radiator. A 360 mm side radiator
conflicts with HDD cages in the same chamber. A 280 mm radiator is not expected
to fit in the side position because of width constraints near the front I/O
area.

VERIFY: Confirm whether the local unit still has the side 360 mm mount bracket.
It is a separate aluminum piece.

### Rear Fan Mount

Standard rear configuration is a 120/140 mm hex mesh fan position. Some variants
may have only a 120 mm fan hole. Confirm the local rear-panel variant before
planning airflow.

### HDD Chamber / Flex Bay Column

The left/front section houses the 9-position flex bay column and HDD chamber.
One HDD rack holds 4x 3.5 in drives or 8x 2.5 in SSDs with adapters. The HDD
chamber can alternatively mount a 240 mm radiator if the rack is removed.

## Midplate / Chassis Divider

The midplate is the aluminum divider between the main cube and pedestal. In an
S8 + pedestal configuration, it becomes the planning surface for QDC
pass-throughs, tubing transitions, cable routing, and chamber height.

### Midplate Position Options

- High: maximizes main cube clearance for reservoirs, pump tops, and tall components
- Mid: balances main cube and pedestal volume
- Low: maximizes pedestal volume and reduces main cube clearance

For Le Redempteur, begin with the midplate high during initial assembly and loop
routing. Lower it only after confirming all main cube components clear at final
installed height.

### QDC Pass-Through Positions

Most S8 configurations do not arrive with fixed QDC pass-through positions. The
builder determines them based on the loop architecture.

- Prefer horizontal QDC pass-throughs for serviceability and clean routing.
- Position QDCs before committing to tubing runs.
- Confirm Koolance QDC thread spec before drilling.
- Use at least two QDC pairs: supply and return.
- Consider a third pass-through only if the pedestal receives an isolated drain/service path.

NOTE: Do not drill the midplate until the final loop architecture is confirmed
on paper and mocked up with actual hardware. A hole in an original CaseLabs part
cannot be undone.

VERIFY: Record the recovered midplate dimensions, frame mounting hole positions,
existing cutouts, and material thickness before any modification.

Photograph:

- Midplate front face, before cleaning, with scale reference
- Midplate rear face, showing existing cutouts or marks
- Midplate installed in frame, showing mounting points

### Replacement Midplate Path

If the original midplate cannot be located, replacement options in order of
preference:

1. Secondary market: eBay, r/hardwareswap, Overclock.net buy/sell/trade, HardForum.
2. Fabrication from measurement: waterjet or laser-cut aluminum based on verified local dimensions.
3. Community CAD files: Overclock.net S8 threads, r/caselabs, and surviving CaseLabs-owner archives.

## Motherboard Tray Installation Sequence

### Tray Removal

1. Open or remove the right side panel.
2. Locate the four tray securing screws on the frame perimeter.
3. Remove all four screws and label them.
4. Slide the tray toward the open right side.
5. Support the tray from underneath once clear of the frame.

Do not force the tray. Powder-coated aluminum can be damaged by impatience.

### Bench Assembly On Tray

1. Install motherboard standoffs for the selected board form factor.
2. Install motherboard.
3. Route 24-pin and CPU power through the tray cutouts.
4. Install GPU or GPUs.
5. Confirm GPU waterblock mounting before reinstalling the tray.
6. Install M.2 drives, RAM, and bench-access components.
7. Partially route CPU/GPU tubing while the tray is still outside the case.
8. If using under-tray storage, route SATA and power before reinserting.

### Tray Reinstallation

1. Align the tray with the frame channel.
2. Slide the tray in carefully.
3. Watch tubing and cables at the frame gap.
4. Confirm the tray is fully seated.
5. Reinstall all four securing screws.
6. Do not overtighten into aluminum.

## Pedestal Assembly And Connection

The pedestal attaches under the main cube and acts as the machine room:
radiators, PSU, storage, cable management, drain/service hardware, and lower
thermal infrastructure.

### Physical Connection

1. Position the pedestal on locked casters or feet.
2. Lower the main cube frame onto the pedestal.
3. Align the pedestal top mounting points with the main cube base frame.
4. Confirm flush seating with no rocking.
5. Secure all mounting points with the correct hardware.

NOTE: Lock pedestal casters before any assembly work.

### Pedestal Internal Layout

Working concept:

- Left side: 360 mm PE radiator, drive archive rack, intake airflow path
- Right side: PSU, cable management, SAS breakout routing, service drain, possible additional 360 mm radiator

VERIFY: Confirm the local pedestal radiator mounts and airflow path before
planning the loop.

Photograph:

- Pedestal top face and main cube connection points
- Internal left chamber
- Internal right chamber
- Underside with PSU vent and caster positions

### PSU Mounting

The PSU can mount in the main cube or pedestal. For this build, pedestal mounting
with fan-down intake through the underside hex mesh is preferred for thermal
separation.

NOTE: Do not reuse a decade-old PSU without full inspection. Capacitor aging,
contact corrosion, and unknown storage history make old PSUs a risk to the
archive object.

## Radiator Mounting

Target baseline: three active 360 mm radiators, with more positions available
only if the final thermal plan justifies them.

### Main Cube Positions

- Top position 1: 360 mm, drop-in recommended
- Top position 2: 360 mm, drop-in recommended
- Side position: 360 mm or 240 mm
- HDD chamber, rack removed: 240 mm
- Rear: 120 mm or 140 mm fan only

### Drop-In Mount Assembly Sequence

1. Assemble radiator and fans onto the drop-in plate outside the case.
2. For push-pull, attach both fan faces before lowering the assembly.
3. Lower complete drop-in assembly into top frame.
4. Secure with correct screws.
5. Do not overtighten.
6. Connect fan headers to Aquaero channels before tubing blocks access.

Noiseblocker eLoop orientation must be confirmed before final mounting. For top
radiators, exhaust upward is the likely starting point. For the pedestal, intake
from outside and exhaust through radiator should be evaluated against actual
airflow.

## Loop Architecture Reference

This is the favored serial loop architecture for Le Redempteur. Parallel loops
are not planned for the first return. Serial routing is easier to fill, bleed,
monitor, and service.

### Planned Serial Route

1. Dual D5 pumps in EK dual top, outlet to loop
2. Top radiator 1, right 360 mm XTX
3. CPU block
4. GPU block
5. Down through midplate QDC pass-throughs into pedestal
6. Pedestal 360 mm radiator and service/drain zone
7. Back up through floor QDCs into main cube
8. Top radiator 2 and/or side/front 360 mm
9. EK cylinder reservoir, visible through right window
10. Return to pump inlet

Position the Aquaero flow meter after pump outlet and before the first radiator.
Minimum temperature probes:

- Loop return before pump inlet
- Post-radiator temperature after top radiator stack
- Additional distributed probes for main cube and pedestal thermal zones

### Fill And Bleed

1. Fill main cube loop first with pedestal QDCs disconnected.
2. Run pumps at low speed.
3. Tilt case carefully to purge air through the reservoir.
4. Connect pedestal QDCs.
5. Top up reservoir.
6. Run full loop until flow meter readings stabilize.
7. Run a 24-hour leak test before closing panels.

Plan the pedestal service drain before cutting tubing.

## Panel Reference

All panels on this build are white powder-coated aluminum. Panels attach with
hex-head or thumb screws and should be removed and reinstalled carefully to
avoid scratching the finish.

### Panel Inventory Checklist

- Right door: full window / standard window / solid / ventilated
- Left door: full window / standard window / solid / ventilated
- Front cover: window / ventilated / solid
- Top panel: drop-in mount present / integrated mount / extended top
- Rear panel: 120/140 mm hex mesh / 120 mm fan hole
- Bottom or pedestal top: PSU vent hex mesh present

VERIFY: Photograph all panels before cleaning and before final assembly. Record
panel type, damage, scratches, dents, missing fasteners, and powder-coat wear.

## Hardware And Fastener Reference

- Panel screws: typically 6-32 machine screws, thumb or hex head
- Drop-in mount screws: use matching mount hardware
- Motherboard tray screws: 4x frame-to-tray securing screws
- Motherboard standoffs: standard 6-32 brass standoffs
- Fan/radiator screws: M3, length varies with fan/radiator stack
- QDC bulkhead thread: VERIFY before drilling midplate

Bag fasteners by observed location until thread type, length, and count are
confirmed.

## Field Notes

Add dated observations, measurements, corrections, and contradictions as the
build proceeds. The archive remembers what panic forgets.

Suggested entries:

- Entry 1: Midplate measurements
- Entry 2: Pedestal mounting point confirmation
- Entry 3: Side radiator bracket status
- Entry 4: Top drop-in mount inventory
- Entry 5: Motherboard tray type
- Entry 6: Fastener count by assembly stage
- Entry 7: QDC mockup position
- Entry 8: Leak-test result

## Source Record

The recovered draft names the following source basis. Where information
conflicts, direct measurement of the physical unit supersedes every documented
source.

- ExtremeRigs.net: CaseLabs Mercury S8 full review, April 2014, Stren
- Hardware Canucks: Mercury S8 forum thread, January 2014
- Overclock.net: "CaseLabs announces the Mercury S8" thread, 2014-2016
- HardForum: "New CaseLabs S8 Horizontal ATX" thread, February 2014
- Overclock.net: "Grey Horizon" S8 + pedestal build log
- Overclock.net: "Manuals? Assembly guidelines?" thread, November 2017
- PCPartPicker: "Case Labs Mercury S8: Midnight Express" build log
- Singularity Computers: CaseLabs S8 distribution plate product pages
- bestcases.eu: CaseLabs official distributor and S8 drop-in mount listings

## Next Pass

1. Verify every dimension against the physical white S8 and pedestal.
2. Extract still frames from the assembly timelapse into numbered plates.
3. Add local photo references from `intake/L-Archive/`.
4. Confirm tray type, midplate location, and top mount inventory.
5. Produce a public illustrated Manual 001 page from verified sections.

## Archive Note

This manual belongs to the archive because it turns scattered surviving
technical knowledge into a usable restoration path. The goal is not to pretend a
vanished factory document has been recovered. The goal is to preserve enough
verified sequence information that the machine can come back together without
guesswork.
