# L’ARCHIVE / Subsystems Dossier

Project ID: `FI-PROJ-001`

Public route: `/projects/caselabs-mercury-s8/`

Record state: working architecture / physical verification in progress

Governing line:

> THIS IS HOW THE SYSTEM AWAKENS. NOT BY FORCE, BUT BY SEQUENCE. PROGRESS IS
> VOLTAGE HELD STEADY.

The line describes the restoration method. It does not declare that the machine
is assembled, powered, stable, or operational.

## Purpose

This dossier divides the CaseLabs Mercury S8 and pedestal restoration into
systems that can be inspected, tested, accepted, or rejected independently. It
is a control document for the return of L’ARCHIVE, not a declaration that the
artwork is assembled or working.

The authoritative structure is:

- **L’ARCHIVE / THE ART** — the entire completed physical system and artwork:
  main Mercury S8 cube plus pedestal as one whole.
- **LE RÉDEMPTEURE / PAST** — Matthew's past persona embodied as the boutique
  hardline-cooled X99 main cube. The MSI X99S XPOWER AC and i7-5930K are its
  historically intended compute platform.
- **LE SAUVEGARDER / PRESENT** — Matthew's present persona embodied as the
  pedestal: the preservation and storage-array chamber.

The storage arrays, completed hardline loop, and reunited artwork remain design
intent until their parts are inventoried, assembled, and verified.

## Claim States

- **Registered** — present in the canonical Forgotten Industries inventory or
  an object record.
- **Operator-confirmed** — identified by direct operator observation or
  retained-hardware knowledge; physical reconciliation may still be pending.
- **Candidate** — preserved for possible use but not yet accepted into the
  working machine.
- **Design baseline** — the current intended architecture, subject to measured
  fit and test evidence.
- **Gated** — no integration may occur until the named test succeeds.
- **Unresolved** — exact identity, completeness, condition, or placement is not
  yet established.

## Subsystem Register

| Subsystem            | Registered or proposed elements                                                                                                                               | Present state                                                                                                                           | Acceptance gate                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structural envelope  | `FI-CASE-001`; `FI-PED-001`; recovered panels, trays, plates, and mounting hardware                                                                           | Registered / dry assembly pending                                                                                                       | Photograph and measure the bare cube and pedestal; reconcile fasteners, tray, plates, pass-throughs, and service access before modification                     |
| Compute core         | LE RÉDEMPTEURE; `FI-HW-MB-X99-001` MSI X99S XPOWER AC; `FI-HW-CPU-X99-001` Intel Core i7-5930K                                                                | Historically intended platform / function unverified under the separate `FI-PROJ-009` record                                            | Reach firmware on air with known-good power, one known-good DDR4 UDIMM, discrete graphics, and no storage, network, or liquid loop attached                     |
| Bench thermal gate   | LGA2011-v3 square-ILM air cooler; stock motherboard VRM heatsinks                                                                                             | Cooler not yet assigned                                                                                                                 | Use a complete four-post cooler suitable for the processor's stock thermal load; record fan speed and temperature stabilization before further testing          |
| Main liquid loop     | `FI-RAD-001` three EK XTX 360 radiators; `FI-RAD-002` one slim 360 radiator; `FI-PUMP-001` two Aqua Computer D5 Aquabus pumps; `FI-RES-001`; `FI-FIT-QDC-001` | Registered / each component requires service testing                                                                                    | Clean, inspect, and pressure-test components separately; prove the assembled loop for 24 hours with compute and storage unpowered                               |
| Board liquid cooling | `FI-BLOCK-MOSFET-001` EK-MOSFET MSI X99 XPower block                                                                                                          | Registered / boxed / contents and seals unverified                                                                                      | Prove the X99 platform on air first; then inventory screws, pads, seals, and mounting hardware before pressure testing the block                                |
| Control and airflow  | `FI-CTRL-001` Aquaero 6 XT; `FI-FAN-001` Noiseblocker eLoop group; `FI-FAN-002` Corsair 120 mm fan group; sensors still to be reconciled                      | Registered / count and function testing pending                                                                                         | Verify controller display, buttons, headers, Aquabus path, fan bearings, PWM response, and sensor readings on the bench                                         |
| Power                | `FI-PSU-001` Corsair AX1500i                                                                                                                                  | Registered / physical custody confirmed / cable set and electrical state unverified                                                     | Match every modular lead to the exact supply, inspect connectors, and complete a controlled electrical test before connection to restored hardware              |
| Mechanical storage   | LE SAUVEGARDER; `FI-CL-PART-001` eight-drive vibration-isolated pedestal mount; two planned stacks of four; original mounting hardware reported retained      | Registered / hardware completeness and orientation require direct reconciliation                                                        | Dry-fit the complete mount in `FI-PED-001`; confirm airflow, connector access, cable bend radius, fastener count, and vibration isolation                       |
| Drive set            | `FI-HDD-001`; eight operator-reported WD VelociRaptor 450 GB drives acquired for the mount around 2014                                                        | Registered set / four `WD4500BLHX-01V7BV0` drives privately label-reconciled / four pending inspection                                  | Test every drive by direct SATA: identity, SMART report, short and extended self-tests, and a complete read pass; no array admission on USB-dock evidence alone |
| Drive carriers       | `FI-HDD-ICEPACK-001`; operator-identified WD IcePack 2.5-to-3.5-inch mounting frames and heat sinks                                                           | Four photographed with drives installed / exact part number, revision, wider count, adapter hardware, and thermal-pad condition pending | Reconcile each remaining frame, then map one qualified drive and carrier assembly to each pedestal bay                                                          |
| Storage data path    | Separate SSD boot device; IT-mode HBA; four mirrored drive pairs striped across the set; one four-drive power and data branch per physical stack              | Design baseline / controller and SSD not selected                                                                                       | Select exact hardware only after drive qualification and dry-fit; record port-to-bay map before creating the array                                              |
| Custody boundary     | Independent archive copies outside L’ARCHIVE                                                                                                                  | Mandatory design rule                                                                                                                   | The Raptor array may serve as a working, scratch, or exhibition tier; it must never become the only copy of archive material                                    |

## Compute Core Boundary

The X99 assembly is the historically intended compute platform for LE
RÉDEMPTEURE. It does not transfer into `FI-PROJ-001` as working hardware. Its
motherboard and processor remain registered under the
[X99 / Impact Recovery dossier](/projects/x99-impact-recovery/) because the
historical boot and configuration failure is part of their provenance. Recovered
records and operator identification establish that the platform operated in the
2014 test-bench system; they do not establish present function. The ASUS Rampage
IV Black Edition / X79 is recorded only as the operator-identified predecessor
and planned prior platform. It is presently missing, and no claim of physical
installation in the Mercury S8 is made without further evidence.

The board is presently stored in its plastic tray with the i7-5930K seated and
latched, zero RAM installed, and no current-pass power-on completed. Move it to
a clean cardboard motherboard box or another rigid nonconductive bench surface
before applying power. Never power it atop an antistatic bag.

The first-power configuration is deliberately small:

1. MSI X99S XPOWER AC with the installed Intel Core i7-5930K.
2. Compatible square-ILM air cooler with complete mounting hardware.
3. One known-good non-ECC unbuffered DDR4 UDIMM at a standard JEDEC setting in
   `DIMM1`. Loose HyperX Fury and Corsair Vengeance LPX DDR4 are now in visible
   custody, but their labels, compatibility, and function remain unverified.
4. The non-modular Thermaltake 600 W only after its exact model label, age,
   fixed leads, and condition are cleared. Use the native 24-pin ATX and
   CPU/EPS 8-pin leads, never a PCIe lead in the CPU-power socket.
5. The air-cooled GTX 1060 6 GB, keyboard, and monitor. Do not power the
   waterblocked GTX 780 dry.
6. Cleared CMOS and one recorded attempt to reach firmware.

No drives, M.2, Wi-Fi, network connection, firmware update, pump, or
liquid-cooling hardware enter this first test. The preserved but unverified
AX1500i remains outside the first pass. Loose VGA-labeled modular cables remain
unassigned until their exact PSU provenance is established; modular cables are
never mixed. Diagnostic code, CPU identification, memory detection, fan speed,
temperature behavior, and every stop condition enter the field log.

Under LE CONTINUANT, a successful first POST is not the continuity handoff.
JJAMMOCAN remains intact until LE RÉDEMPTEURE demonstrates repeatable cold
boots, stable firmware recognition, memory validation, and stock thermal and
load stability.

## Storage Architecture

LE SAUVEGARDER is the pedestal and preservation chamber. Its recovered mount
presents eight positions in two physical stacks of four. The corresponding
`FI-HDD-001` drive set is reported by the operator as eight WD VelociRaptor
450 GB units purchased for this installation around 2014. Original mounting
hardware and the `FI-HDD-ICEPACK-001` carrier set are also reported retained.
The storage array remains planned until all eight drives, carriers, data paths,
power paths, and independent archive copies are reconciled and verified.

Four drives have received preliminary non-destructive inspection through USB
bridges. Each identified as a 450.1 GB `WD4500BLHX-01V7BV0`, and none presented
a recognized partition map. Direct read-only probes of the first three reported
no physical I/O errors; the fourth bridge session did not permit a direct
raw-device read. None of the bridge sessions exposed SMART data. This is
evidence of identity and preliminary media response, not an array-grade health
certification. WD literature identifies
the `WD4500BLHX` as the 2.5-inch drive and the `WD4500HLHX` as the corresponding
3.5-inch IcePack-equipped assembly. The retained carriers are therefore
registered separately. Label photography on 2026-07-30 privately reconciled
four distinct drive serial and WWN pairs and showed all four installed in
IcePack carriers bearing a B1 marking. Exact carrier part numbers, revisions,
adapter completeness, and thermal-pad condition remain unresolved. A separate
1 TB Seagate SSHD that produced kernel I/O errors is excluded from this
subsystem.

### Design Baseline

- Raw capacity: 3.6 TB decimal.
- Proposed usable capacity: 1.8 TB decimal.
- Topology: four mirrored pairs striped across the set, equivalent to RAID10.
- Physical pairing: mirror each drive across the two stacks rather than within
  one stack.
- Data path: one four-lane branch per stack from an HBA operating without
  hardware RAID abstraction.
- Power path: one verified four-drive harness per stack, with spin-up behavior
  observed before final acceptance.
- System disk: separate SSD; the Raptor set does not carry the operating system.

The exact HBA, SSD, filesystem, and operating system remain unresolved. ZFS
mirror vdevs are compatible with the topology, but no filesystem receives a
final assignment until all eight drives pass direct-SATA testing and the board,
controller, and cooling architecture are stable.

## Cooling And Control Architecture

The recovered cooling inventory exceeds the demonstrated thermal requirement.
The system will use only the components that pass service testing and improve
the measured architecture.

The current baseline remains one legible serial loop with two or three active
360 mm radiators, dual D5 pumps, the visible EK reservoir, Aquaero control, and
a quick-disconnect boundary between the main cube and pedestal. The fourth
radiator remains reserve hardware unless measured fit and thermal evidence
justify it.

The MOSFET block is not part of the POST configuration. Stock VRM heatsinks stay
installed until the board earns further work. Every reused wet component must
be opened or inspected as appropriate, cleaned, fitted with serviceable seals,
and pressure-tested before coolant approaches powered electronics.

## Integration Order

1. Photograph and reconcile the empty CaseLabs structures and loose mounting
   hardware.
2. Dry-assemble the cube, pedestal, tray, panels, and `FI-CL-PART-001`.
3. Prove the intended LE RÉDEMPTEURE X99 compute platform on air through the
   `FI-PROJ-009` recovery gate.
4. Test the AX1500i, Aquaero, fans, pumps, radiators, reservoir, QDCs, and blocks
   as independent subsystems.
5. Qualify all eight VelociRaptors by direct SATA and record a stable bay map.
6. Mock up power, HBA, storage, radiator, airflow, drain, and pass-through paths.
7. Freeze the mechanical architecture before drilling, cutting, or permanent
   sleeving.
8. Run the complete proof loop for 24 hours with compute and storage unpowered.
9. Install the accepted compute, control, and storage modules one boundary at a
   time.
10. Record stable operation of LE RÉDEMPTEURE and LE SAUVEGARDER together before
    assigning L’ARCHIVE a restored state.

## Open Reconciliation

- [ ] Acquire or identify the minimum-test LGA2011-v3 square-ILM air cooler.
- [ ] Read the labels on the loose HyperX Fury and Corsair Vengeance LPX DDR4
      and select one known-good compatible UDIMM for first POST.
- [ ] Photograph and clear the exact Thermaltake 600 W model label, fixed leads,
      age, and physical condition.
- [ ] Preserve the AX1500i and reconcile its exact modular cable set separately.
- [ ] Inventory the EK MOSFET block contents and mounting hardware.
- [ ] Inspect `FI-PED-001` and dry-fit `FI-CL-PART-001` with the retained
      `FI-HDD-ICEPACK-001` carrier set.
- [x] Privately reconcile four drive labels and four IcePack frames without
      publishing serial numbers.
- [ ] Photograph and reconcile the remaining four operator-reported drive
      labels and any additional retained IcePack frames.
- [ ] Assign non-public test handles `VR-05` through `VR-08` after label and
      condition capture.
- [ ] Complete direct-SATA SMART and full-surface read testing for every drive.
- [ ] Select the HBA, boot SSD, filesystem, and final port-to-bay map.
- [ ] Confirm radiator count and placement from physical measurements.
- [ ] Define the external backup target before array commissioning.

## Identification References

- Western Digital, _WD IcePack 3.5-inch Mounting Frames_, document
  `2178-771135-A00`, October 2010. The manufacturer sheet identifies the
  IcePack as a heat-sink mounting frame for standard 2.5-inch SATA media,
  compatible with standard 3.5-inch enclosures, and lists retail frame models
  `WDSL002B` and `WDSL002S`. [Preserved scan](https://h30434.www3.hp.com/psg/attachments/psg/Audio/286670/2/Red%20WD%20IcePack.pdf)
- Avago Technologies, _Compatibility Report for iMR SAS Gen3 Controllers_. The
  drive table independently records `WD4500HLHX` as 3.5-inch and
  `WD4500BLHX` as 2.5-inch. [Compatibility report](https://docs.broadcom.com/doc/12348751)

## Process Note

This working draft was assembled through operator-directed collaboration between
Matthew Taylor Marx and OpenAI Codex from the canonical inventory, the CaseLabs
object records, the X99 recovery dossier, current read-only drive observations,
and the authoritative L’ARCHIVE structure. Human judgment remains the
authority for component acceptance, architecture freeze, and public revision.
