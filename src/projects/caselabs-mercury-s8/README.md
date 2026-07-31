# Le Rédempteur / Subsystems Dossier

Project ID: `FI-PROJ-001`

Public route: `/projects/caselabs-mercury-s8/`

Record state: working architecture / physical verification in progress

## Purpose

This dossier divides the CaseLabs Mercury S8 and pedestal restoration into
systems that can be inspected, tested, accepted, or rejected independently.
It is a control document for the return of Le Rédempteur, not a declaration
that the machine is assembled or working.

The main cube remains the visible compute chamber. The pedestal remains the
machine room: power, bulk cooling, storage, cable routing, service drain, and
the quick-disconnect boundary between structures.

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
| Compute core         | `FI-HW-MB-X99-001` MSI X99S XPOWER AC; `FI-HW-CPU-X99-001` Intel Core i7-5930K                                                                                | Candidate under the separate `FI-PROJ-009` fault-history record                                                                         | Reach firmware on air with known-good power, one known-good DDR4 UDIMM, discrete graphics, and no storage, network, or liquid loop attached                     |
| Bench thermal gate   | LGA2011-v3 square-ILM air cooler; stock motherboard VRM heatsinks                                                                                             | Cooler not yet assigned                                                                                                                 | Use a complete four-post cooler suitable for the processor's stock thermal load; record fan speed and temperature stabilization before further testing          |
| Main liquid loop     | `FI-RAD-001` three EK XTX 360 radiators; `FI-RAD-002` one slim 360 radiator; `FI-PUMP-001` two Aqua Computer D5 Aquabus pumps; `FI-RES-001`; `FI-FIT-QDC-001` | Registered / each component requires service testing                                                                                    | Clean, inspect, and pressure-test components separately; prove the assembled loop for 24 hours with compute and storage unpowered                               |
| Board liquid cooling | `FI-BLOCK-MOSFET-001` EK-MOSFET MSI X99 XPower block                                                                                                          | Registered / boxed / contents and seals unverified                                                                                      | Prove the X99 platform on air first; then inventory screws, pads, seals, and mounting hardware before pressure testing the block                                |
| Control and airflow  | `FI-CTRL-001` Aquaero 6 XT; `FI-FAN-001` Noiseblocker eLoop group; `FI-FAN-002` Corsair 120 mm fan group; sensors still to be reconciled                      | Registered / count and function testing pending                                                                                         | Verify controller display, buttons, headers, Aquabus path, fan bearings, PWM response, and sensor readings on the bench                                         |
| Power                | `FI-PSU-001` Corsair AX1500i                                                                                                                                  | Registered / physical custody confirmed / cable set and electrical state unverified                                                     | Match every modular lead to the exact supply, inspect connectors, and complete a controlled electrical test before connection to restored hardware              |
| Mechanical storage   | `FI-CL-PART-001` eight-drive vibration-isolated pedestal mount; two stacks of four; original mounting hardware reported retained                              | Registered / hardware completeness and orientation require direct reconciliation                                                        | Dry-fit the complete mount in `FI-PED-001`; confirm airflow, connector access, cable bend radius, fastener count, and vibration isolation                       |
| Drive set            | `FI-HDD-001`; eight operator-reported WD VelociRaptor 450 GB drives acquired for the mount around 2014                                                        | Registered set / four `WD4500BLHX-01V7BV0` drives privately label-reconciled / four pending inspection                                  | Test every drive by direct SATA: identity, SMART report, short and extended self-tests, and a complete read pass; no array admission on USB-dock evidence alone |
| Drive carriers       | `FI-HDD-ICEPACK-001`; operator-identified WD IcePack 2.5-to-3.5-inch mounting frames and heat sinks                                                           | Four photographed with drives installed / exact part number, revision, wider count, adapter hardware, and thermal-pad condition pending | Reconcile each remaining frame, then map one qualified drive and carrier assembly to each pedestal bay                                                          |
| Storage data path    | Separate SSD boot device; IT-mode HBA; four mirrored drive pairs striped across the set; one four-drive power and data branch per physical stack              | Design baseline / controller and SSD not selected                                                                                       | Select exact hardware only after drive qualification and dry-fit; record port-to-bay map before creating the array                                              |
| Custody boundary     | Independent archive copies outside Le Rédempteur                                                                                                              | Mandatory design rule                                                                                                                   | The Raptor array may serve as a working, scratch, or exhibition tier; it must never become the only copy of archive material                                    |

## Compute Core Boundary

The X99 assembly is the strongest period-correct candidate now present, but it
does not transfer into `FI-PROJ-001` as working hardware. Its motherboard and
processor remain registered under the
[X99 / Impact Recovery dossier](/projects/x99-impact-recovery/) because the
known prior failure is part of their provenance.

The first-power configuration is deliberately small:

1. MSI X99S XPOWER AC with the installed Intel Core i7-5930K.
2. Compatible square-ILM air cooler with complete mounting hardware.
3. One known-good unbuffered DDR4 UDIMM at a standard JEDEC setting.
4. Known-good power supply and verified 24-pin ATX and CPU EPS leads.
5. Known-good discrete graphics, keyboard, and monitor.
6. Cleared CMOS and one recorded attempt to reach firmware.

No drives, network connection, firmware update, or liquid-cooling hardware
enter this first test. Diagnostic code, CPU identification, memory detection,
fan speed, temperature behavior, and every stop condition enter the field log.

## Storage Architecture

The recovered pedestal mount presents eight positions in two physical stacks of
four. The corresponding `FI-HDD-001` drive set is reported by the operator as
eight WD VelociRaptor 450 GB units purchased for this installation around 2014.
Original mounting hardware and the `FI-HDD-ICEPACK-001` carrier set are also
reported retained.

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
3. Prove the X99 candidate on air through the `FI-PROJ-009` recovery gate.
4. Test the AX1500i, Aquaero, fans, pumps, radiators, reservoir, QDCs, and blocks
   as independent subsystems.
5. Qualify all eight VelociRaptors by direct SATA and record a stable bay map.
6. Mock up power, HBA, storage, radiator, airflow, drain, and pass-through paths.
7. Freeze the mechanical architecture before drilling, cutting, or permanent
   sleeving.
8. Run the complete proof loop for 24 hours with compute and storage unpowered.
9. Install the accepted compute, control, and storage modules one boundary at a
   time.
10. Record stable operation before assigning Le Rédempteur a restored state.

## Open Reconciliation

- [ ] Acquire or identify the minimum-test LGA2011-v3 square-ILM air cooler.
- [ ] Identify one known-good DDR4 UDIMM for first POST.
- [ ] Reconcile the exact AX1500i modular cable set.
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
and the established Le Rédempteur return sequence. Human judgment remains the
authority for component acceptance, architecture freeze, and public revision.
