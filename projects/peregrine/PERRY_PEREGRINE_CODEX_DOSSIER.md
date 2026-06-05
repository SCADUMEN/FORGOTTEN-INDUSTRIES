# PERRY / PEREGRINE Codex Dossier

Date logged: 2026-06-05 04:39 CT

## Project Identity

PEREGRINE is the drone field-system branch of Forgotten Industries. It covers
small aircraft experiments, flight logs, recovery routes, crash reports,
maintenance notes, and repair diagnostics.

This is not a generic drone content track. It is a machine dossier: what flew,
what failed, what was recovered, what remains uncertain, and what must be
checked before the next launch.

## Aircraft Registry

### Perry 1 / PEREGRINE-A01

- Platform: DJI Mini 4K.
- Role: crash/recovery bird.
- Archive ID: FI-DRONE-001.
- Status: grounded pending inspection.
- Known lore: roof/awning recovery and the 3 AM "yeeted into the abyss" recovery chaos.
- Current concerns:
  - Error 30210.
  - Back-right arm damage.
  - Abnormal motor resistance.
  - Possible propeller mismatch.
  - Possible propeller screw overtightening.
  - ESC/power hardware should remain in the diagnostic tree.

### Perry 2 / PEREGRINE-A02

- Platform: DJI Mini 3 with DJI RC.
- Role: newer active platform.
- Archive ID: FI-DRONE-002.
- Status: active platform pending baseline documentation.
- Visual mark: `assets/projects/peregrine/peregrine-a02.png`.
- Needs confirmation:
  - Firmware state.
  - Battery count and serials.
  - Propeller package compatibility.
  - Accessory list.

### Perry 3 / PEREGRINE-A03

- Platform: planned DJI Mini 3 replacement.
- Role: next active PEREGRINE aircraft.
- Archive ID: FI-DRONE-003.
- Status: planned / not acquired.
- Needs confirmation:
  - Acquisition source.
  - Aircraft serial.
  - Controller pairing.
  - Battery count and serials.
  - Propeller and screw package source.
  - First baseline inspection.

## Repair Notes

Do not treat calibration as the first fix for a crash-recovered aircraft with
arm damage, motor resistance, or ESC/power symptoms. Start with physical
inspection.

Official DJI propeller guidance for the relevant Mini-class platforms emphasizes
correct frame-arm placement, same-package propeller pairing, and avoiding mixed
propeller types or packages. DJI's Mini 2 propeller listing includes DJI Mini
4K compatibility and says to use propellers from the same package, change the
screws in that package, and not mix propellers from different packages:

https://store.dji.com/product/mini-2-propellers

DJI's Mini 3 propeller listing gives the same frame-arm and same-package
warning for Mini 3 propellers:

https://store.dji.com/product/dji-mini-3-propellers

Community repair reports often associate Error 30210 with ESC/power hardware,
motor, or arm damage. Keep those reports as leads, not proof, until the aircraft
is inspected.

## Visual Identity

The A02 mark is archived as `assets/projects/peregrine/peregrine-a02.png`.
The original source filename was `pergerine-a02.png`; the repository copy uses
the corrected PEREGRINE spelling.

## Diagnostic Tree: Error 30210

1. Preserve the app error screen.
2. Photograph the aircraft as found.
3. Inspect props by motor position.
4. Confirm marked/unmarked propeller placement.
5. Confirm both blades on each motor came from the same package.
6. Confirm propeller screws are correct, seated, and not overtightened.
7. Spin each motor by hand and compare resistance.
8. Inspect the back-right arm for shell deformation, hinge damage, wire strain, and motor mount shift.
9. Inspect battery bay, contacts, and shell for impact clues.
10. Power on only after the physical check is documented.
11. Treat calibration as a later step, not as a substitute for mechanical inspection.

## Preflight Checklist

- Aircraft ID confirmed.
- Battery charged and seated.
- Firmware/app state noted.
- Props clean, undamaged, correctly placed, and same-package paired.
- Propeller screws seated without overtightening.
- Arms unfolded and locked into normal position.
- Motors rotate smoothly by hand.
- Gimbal guard removed.
- Lens and sensors clean.
- Launch zone clear.
- Weather and wind noted.
- Return-to-home behavior checked.
- Recording/storage state checked.

## Post-Crash Checklist

- Disarm and secure aircraft.
- Remove battery if safe.
- Photograph location and aircraft before moving parts.
- Record time, weather, flight mode, altitude, speed, and last control input if known.
- Preserve app warnings and error codes.
- Photograph each arm, propeller, motor, gimbal, shell, battery bay, and landing gear.
- Bag removed propellers and screws by motor position.
- Do not fly again until damage inspection is complete.

## Repo Structure

```text
projects/peregrine/
  README.md
  PERRY_PEREGRINE_CODEX_DOSSIER.md
  perry_peregrine_aircraft.yaml
  AGENTS.md
  templates/
    flight-log.md
    crash-report.md
    maintenance-log.md
src/
  projects.yml
  inventory.yml
  field-logs.yml
```

## Ready-to-Paste AGENTS.md Section

```markdown
## PEREGRINE Drone Experiments

PEREGRINE records drone flight experiments, crash recovery, maintenance,
repair diagnostics, and small-aircraft field notes.

Preserve evidence before interpretation:

- Photograph aircraft before repair.
- Keep propellers and screws grouped by motor position.
- Mark uncertain model, firmware, battery, and accessory details as NEEDS_CONFIRMATION.
- Ground any aircraft with crash damage, motor resistance, structural damage, or ESC/power warnings.
- Treat calibration as secondary until physical inspection is complete.
- Prefer official DJI repair, safety, and propeller guidance over forum guesses.

Write logs as machine evidence: flight conditions, control state, aircraft
state, failure mode, recovery route, inspection results, repair action, and
next safe test.
```

## Open NEEDS_CONFIRMATION Items

- Exact date and time of the A01 crash.
- Exact location/context of roof and awning recovery.
- Exact Error 30210 wording and DJI Fly screen state.
- A01 propeller package source and screw history.
- A01 back-right arm photos and motor spin comparison.
- A02 serial, firmware, battery inventory, and accessory list.
- A03 acquisition source, serial, battery inventory, and baseline inspection.

-- Forgotten Industries // PEREGRINE Dossier // 2026.06.05
