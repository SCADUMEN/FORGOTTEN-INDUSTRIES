# X99 / Impact Recovery Dossier

Project id: `FI-PROJ-009`

Public route: `/projects/x99-impact-recovery/`

## Purpose

This dossier registers two enthusiast-era platforms returned from storage in July 2026. It begins at recovery intake, before cleaning, diagnosis, sale, or reconstruction.

The record does not assume that either platform works. The MSI X99 assembly carries a direct operator recollection of prior failure. The ASUS assembly has not yet received a controlled bench test. The water-cooling parts are treated as separate pressure-test subjects until their internal condition is known.

## Platform A / MSI X99

- Motherboard: MSI X99S XPOWER AC.
- Socket and memory: LGA2011-v3 / eight DDR4 slots.
- Processor: installed; operator recollection narrows it to an Intel Core i7-5930K or Core i7-5960X.
- Processor identity: provisional until the heat spreader is cleaned and read directly.
- Known history: the platform previously failed to operate; the operator suspects that something may have burned out.
- Present status: fault isolation pending. Do not represent as working.

## Platform B / ASUS Impact

- Motherboard: ASUS ROG Maximus VII Impact Rev. 1.02.
- Socket and memory: LGA1150 / two DDR3 slots / mini-ITX.
- Processor: not present in the current photographs.
- Retained hardware: SupremeFX Impact II audio daughterboard, rear I/O shield with antenna leads, and an EK CPU/VRM monoblock identified by the operator as matched to the board.
- Present status: socket inspection and minimum bench validation pending.

## Supporting graphics assembly

- Card: EVGA GeForce GTX 660 Ti, identified by the operator.
- Cooling: EK full-cover GPU water block with two fittings installed.
- Exact variants: not yet read from labels.
- Present status: electrical test, internal block inspection, and pressure test pending.

## Evidence map

- `msi-x99s-xpower-ac-overview.jpg` — X99 board, installed CPU, eight DIMM slots, expansion layout, diagnostic display, and Wi-Fi module.
- `msi-x99s-xpower-ac-cpu.jpg` — closer X99 platform view; the processor markings remain hidden by thermal compound.
- `asus-maximus-vii-impact-socket.jpg` — Maximus VII Impact Rev. 1.02 board marking and empty LGA1150 socket.
- `asus-supremefx-impact-ii.jpg` — loose SupremeFX Impact II daughterboard with the ASUS platform behind it.
- `asus-impact-ek-monoblock.jpg` — loose EK monoblock retained with the ASUS assembly.
- `evga-gtx-660-ti-ek-waterblock.jpg` — water-cooled EVGA graphics assembly with EK full-cover block and fittings.

Public derivatives have photographic metadata removed. Frames carrying weaker evidence, room context, or labels unnecessary to the public record remain outside the published set.

## Recovery sequence

### Preserve

1. Photograph both sides of each board before cleaning.
2. Photograph the X99 processor markings after removing thermal compound.
3. Photograph both sockets straight-on under bright angled light.
4. Record every serial or manufacturing label locally; do not publish it by default.

### Isolate

1. Inspect the X99 board for heat discoloration, damaged power stages, missing components, socket damage, conductive residue, and abnormal odor.
2. Inspect the ASUS socket before introducing a processor.
3. Keep both liquid-cooling blocks outside any live computer loop until cleaned and pressure-tested.

### Minimum bench / X99

1. Known-good power supply with verified 24-pin ATX and CPU EPS leads.
2. Installed CPU with a compatible air cooler.
3. One known-good DDR4 module in the documented single-module slot.
4. Known-good discrete graphics card; Haswell-E does not provide integrated graphics.
5. Keyboard and monitor only. No SSD, network, liquid loop, or firmware update on first power.
6. Clear CMOS, power once, and record the diagnostic code and all fan or temperature behavior.
7. Stop for smoke, electrical odor, visible arcing, or rapidly heating components.

### Minimum bench / ASUS

1. Inspect and clear the socket first.
2. Use a low-risk known-good LGA1150 processor, compatible air cooler, and one known-good DDR3 module.
3. Clear CMOS and enter firmware only. No storage writes or permanent assembly.
4. Record CPU identification, memory detection, fan speed, temperatures, and any diagnostic state.

## Claim boundary

- `identified` means the board marking or operator identification is recorded.
- `untested` means no present working claim exists.
- `known prior failure` applies to the X99 platform and remains part of the record even if it later returns to service.
- `monoblock` refers to the ASUS CPU/VRM cooling artifact. The GTX 660 Ti carries a full-cover GPU block.
- Exact CPU, graphics-card variant, block part numbers, and mounting-hardware completeness remain provisional.

## Next evidence

- Clean X99 CPU heat spreader and record its exact model.
- Capture a straight-on ASUS socket photograph.
- Inventory retained monoblock mounting hardware.
- Read the EVGA and EK product labels locally.
- Run dry visual inspection before any power or coolant enters the assemblies.
