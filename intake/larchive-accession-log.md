# L'ARCHIVE — Accession Log

Running register of hardware and material assets entering the Forgotten Industries archive. Each entry records verified facts at time of logging, separate from inference or plan. Photos referenced by original filename; not reproduced here.

---

## LA-0001

**Date logged:** 2026-08-25
**Item:** Intel Xeon E5-2660 v2, boxed (retail packaging)
**Provenance:** Found in inventory, untracked prior to this entry. Origin and acquisition date unknown.

**Verified from label/die markings (photos: IMG_5427–5429):**
- Intel Xeon E5-2660 v2, S-Spec SR1AB
- 2.20GHz base, 10C, 95W
- Part No: BX80635E52660V2
- Pack Date: 7/06/2017
- Assembled/marked: Costa Rica
- Die marking: 3408B336, e4
- Socket: LGA2011 (narrow ILM) — Ivy Bridge-EP

**Condition:** Box intact, no visible tamper damage. Security seal labels present on both sides of the die window. Seal integrity not independently verified — visual inspection only, chip not removed from box for this log.

**Compatibility disposition:**
- NOT compatible with the locked X10DRG-Q platform (LGA2011-3 / C612). Different socket generation.
- Compatible only with C600/C602-series boards — i.e., the disqualified X9-generation platform.
- Ivy Bridge-EP predates AVX2. Confirms existing disqualification of X9-gen hardware for CPU-side OCR/transcription/embedding/quantization workloads. This chip does not change that call.

**Disposition / status:** Held as X9-mule candidate only. Not scoped into the ATLAS Council compute build. No board currently owned to pair it with.

**Next action:** None required. Re-evaluate only if an X9-class board is acquired for commissioning/secondary-node purposes.

---

## LA-0002

**Date logged:** 2026-08-25 (updated same day with photo confirmation)
**Item:** AMD FX-8350 (Piledriver)
**Provenance:** Self-reported find, confirmed by photo same day. Found seated in a Gigabyte GA-970A-DS3P board — see LA-0003.

**Verified from die markings (photo: photo.jpeg):**
- AMD FX-8350
- Part/OPN: FD8350FRW8KHK
- Lot: FA 1651PGS, 9GU3519N70380
- Diffused in Germany, made in Malaysia
- © 2011 AMD
- Socket AM3+, 8 threads / 4 modules (CMT), base 4.0GHz, turbo 4.2GHz, TDP 125W

**Condition:** Used — visible thermal paste residue and light scratching on IHS. Currently seated in socket on the board logged as LA-0003. Power/boot status not tested.

**Next action:** None. Log test/boot status if and when powered on.

---

## LA-0003

**Date logged:** 2026-08-25
**Item:** GIGABYTE GA-970A-DS3P motherboard (rev 2.1)
**Provenance:** Found paired with the FX-8350 (LA-0002), CPU pre-seated in socket. Board in anti-static bag inside original retail box (photo: photo.jpeg). Acquisition date unknown.

**Verified from board/box (photos: photo.jpeg):**
- Gigabyte GA-970A-DS3P, rev 2.1, model code D33006
- Chipset: AMD 970 (9-series family)
- Socket AM3+, DDR3, HT3.0
- 4x PCIe (incl. PCI Express 2.0 x16), SATA3 6Gb/s, UEFI DualBIOS
- Designed in Taipei

**Condition:** Board in anti-static bag, box shows moderate wear (scuffing, corner damage) but no water/impact damage visible. FX-8350 physically installed in socket. Not powered on or tested for this log.

**RAM history:** This board ran both kits fully populated (4 slots) — Matthew states this as certain, with photos to confirm, not recollection. What's IIRC is only the specification detail: that the two kits were the Kingston HyperX Genesis (LA-0011) and Corsair XMS3 (currently in LA-0006), 2x4GB each, 16GB total, for the FX-8350 build. Newly provided photos (IMG_5053, IMG_5029) show this board with the FX-8350 installed and an unidentified PCIe add-in card resting across it; DIMM slot population isn't clearly countable from these particular angles, so they don't yet fully confirm "4 slots populated" on their own — see the open discrepancy logged under LA-0011 regarding a possible third Kingston module. Photos also show the board sitting on a USPS Priority Mail box with packing materials nearby, suggesting this assembly was being packed around the same time — context noted, not interpreted further.

**Next action:** None. Log boot/POST status if and when tested.

---

## LA-0004

**Date logged:** 2026-08-25
**Item:** Samsung 2.5" SATA SSD, currently mounted in a case drive bay
**Provenance:** Described as "2tb 870 evo." Photo (IMG_5438) shows partial label conflicting with that description — see note below.

**Verified from label (photo: IMG_5438):**
- Series: "870 Q[VO]" — yellow/gold accent color, consistent with the QVO line, not EVO
- Partial cert string: "R-R-SEC-MZ-77Q8T0" — MZ-77Q8T0 is Samsung's SKU for 870 QVO **8TB**, not 2TB
- PSID: 1C9SRBZGKGKZZKH4YYCRCGCM8LCU9ME6
- WWN: 5002538F3191B1FB
- Rated DC+5V, 1.4A
- UL E149091, TÜV Rheinland certified, KC mark

**Capacity:** 2TB (confirmed by Matthew, 2026-08-25). Note: this is testimony, not instrument verification — the legible label fragment ("MZ-77Q8T0") still points to the 8TB QVO SKU under Samsung's standard naming, and that hasn't been reconciled. Possible explanations: partial/incorrect OCR read on a damaged label, or the fragment isn't the full model string. Not resolved either way.

**Discrepancy flag:** Series read as 870 QVO (yellow accent) from the photo. PN and MODEL fields are torn/obscured by adhesive residue and not independently confirmed.

**Condition:** Label significantly damaged — large sections torn away with black adhesive residue covering the PN and MODEL lines. S/N partially obscured. Currently screwed into a case drive bay; not pulled or bench-tested for this log.

**Next action:** Confirm actual model/capacity via `smartctl -a` or OS disk info next time the drive is accessible. Update this entry once confirmed rather than logging a new one.

---

## LA-0005

**Date logged:** 2026-08-25
**Item:** Samsung SSD 990, M.2 2280 NVMe
**Provenance:** Found, no further origin info given. Capacity stated as 1TB, matching label.

**Line:** Confirmed **not** 990 PRO (per Matthew, 2026-08-25). Matthew's best read: 990 EVO Plus, running/rated Gen4. This is consistent with known specs — EVO Plus is dual-mode (PCIe 4.0 x4 / 5.0 x2), while plain 990 EVO is marketed Gen5-first. Still testimony, not instrument-confirmed. Public SKU lookup has no exact match for "MZ-V9V1T0" as photographed; known 990-series model strings are MZ-V9P1T0 (PRO), MZ-V9E1T0 (EVO), MZ-V9S1T0 (EVO Plus) — the V9V label read is likely a transcription error off a blurry photo (S or E misread as V), and MZ-V9S1T0 lines up with Matthew's EVO Plus call.

**Verified from label (photo: photo.jpeg):**
- Samsung 990 (PRO/EVO designation not visible in this label crop)
- PN: MZVMX1T0HDLD
- Model: MZ-V9V1T0
- Cert model string: R-R-SEC-MZ-V9V4T0
- EUI64: 0025386661700D83
- SN: S81SNT0L601471T (0/O ambiguous on label, transcribed as read)
- PSID: 4LWL3J2UMWS6P8HKGE7CTNLTP8CM4DYH
- Date code: 2026.06
- Rated DC 3.3V, 1.85A
- Product of Vietnam
- 1TB printed on label
- Reverse side certs: CE, UKCA, FCC, KC, UL E148091, D33479 RoHS, VCCI, TÜV Rheinland

**Condition:** No visible physical damage. Not tested for this log.

**Next action:** Run `nvme id-ctrl` or `smartctl -a` to pull the exact model string and close out EVO vs EVO Plus.

---

## LA-0006

**Date logged:** 2026-08-25
**Item:** OEM Intel-chipset motherboard assembly — board, stock cooler, RAM installed. CPU confirmed by die photo as Core i5-2300.
**Provenance:** Found assembled as photographed. No box, no separable packaging.

**Verified from board/cooler (photos: IMG_5436, IMG_5437):**
- Cooler: genuine Intel stock unit, Socket-H mount pattern, PN E97378-001, CNSH5115L4, model F90T12NS1B7-64A01C1, DC12V 0.28A, made by Nidec. This mount pattern is shared across LGA1150/1155/1156, so it fits this board but is not native to it — per Matthew (2026-08-25), this cooler actually originated with the Pentium G3258 (LA-0009), not with the i5-2300. Logged here as a separated pairing: the physical cooler sits on this board, but its provenance traces to LA-0009.
- Board marking: "D33025" visible near top edge, corroborated again in the die photo (IMG_5332).
- RAM: 2x Corsair XMS3 DDR3 installed in the blue-colored DIMM slots; the two black slots are empty. Confirmed via clearer follow-up photo (IMG_5082, IMG_5083): part CMX4GX3M1A1600C9, DDR3-1600, CL9 (9-9-9-24), 4GB each (8GB total), 1.65V, Made in Taiwan. The two modules are different PCB revisions — ver5.11 (barcode ...112903250) and ver2.12 (barcode ...113000065) — same part number, not identical boards. Matthew states with certainty (photos exist) that this kit ran fully populated alongside the Kingston HyperX Genesis kit (LA-0011) in the AM3+ Gigabyte board (LA-0003) for the FX-8350 build; the IIRC hedge applies only to specific kit-identity details, not to the fact of joint use.
- Expansion: 1x PCIe x16 (blue), 1x PCIe x1, 1x PCIe x4, 1x legacy PCI
- Storage: 4x SATA headers (2 red, 2 blue)
- Power: 24-pin ATX + 4-pin CPU
- Rear I/O: parallel port (DB25), PS/2, USB, network jack
- Compliance stamp: "CLASS-B CANADA ICES-003"
- No board manufacturer/brand name conclusively legible in these photos — "D33025" suggests an Intel reference design OEM'd to an integrator, but the integrator itself isn't confirmed.

**CPU — confirmed:** Core i5-2300, confirmed by die photo with cooler removed (IMG_5332, 2026-08-25). Die text legible as "INTEL(R) CORE(TM) i5-2300," rated ~2.8GHz base, Malaysia assembly. Photo is blurry enough that the S-Spec/batch code isn't reliably transcribed — identity is closed on model number, not on exact stepping/batch. Sandy Bridge, LGA1155, 4C/4T, base 2.8GHz, turbo 3.1GHz, 6MB cache, 95W TDP.

**Condition:** Assembled and apparently complete (board + cooler + partial RAM). Visible dust/handling wear, no obvious physical damage. Not powered on for this log.

**Next action:** None required. Log RAM capacity if legible on removal, or boot status if tested.

---

## LA-0007

**Date logged:** 2026-08-25
**Item:** Gigabyte B650M C V2 motherboard (mATX, AM5, DDR5), installed in a case. CPU stated as Ryzen 5 7600 — photo shows the socket empty.
**Provenance:** Found assembled in-case as photographed.

**Verified from board (photo: IMG_5434):**
- Board silkscreen: GIGABYTE B650M C V2
- Socket: AM5 (confirmed on the retention bracket — "AMD RYZEN" / "AM5" markings)
- Memory: DDR5, 4 DIMM slots (partial labels visible: DDR5_A1, DDR5_A2, DDR5_B1...); slots appear unpopulated in this photo
- Expansion: 1x full-length PCIe x16 (red, reinforced), additional black PCIe slots below (exact count/electrical spec not legible)
- Storage: at least 2x M.2 slots (partial labels: M2A_CPU, M2P_CPU)
- Rear I/O: HDMI, multiple USB-A, network jack(s), audio stack
- No GPU installed in the primary PCIe slot at time of photo
- Case interior shows dust/debris and stray fibers; cabling (24-pin ATX, CPU power, SATA, an unconnected PCIe power lead) present but not fully dressed

**CPU:** Ryzen 5 7600 — confirmed by die reading (Matthew, 2026-08-25). Identity closed out.

**Condition:** Not powered on. Before reseating: wipe paste from both socket and CPU IHS, then inspect socket contacts for bent pins as routine practice — normal precaution for any AM5 (LGA-style) reseat, not a sign of a known problem here.

**Next action:** None. CPU and board identity both confirmed. Boot test whenever convenient.

---

## LA-0008

**Date logged:** 2026-08-25
**Item:** DDR4 memory module, no module-level brand markings visible. Stated: likely HyperX.
**Provenance:** Found loose, no packaging. Brand is testimony — photos show no HyperX/Kingston branding, only DRAM IC-level markings.

**Verified from photos (IMG_5196, IMG_5194, IMG_5193, IMG_5192; clearer follow-up shots IMG_5440, IMG_5441, IMG_5442):**
- DRAM IC marking, repeated across 4 visible chips on this face: "SK hynix H5AN4G8NMFR 439A" — a legible SK hynix DDR4 chip part number. This identifies the memory IC vendor, not the module brand; SK hynix chips ship on modules from many third-party makers, HyperX included.
- Printed white sticker on PCB reads "6762523" in the clearer photos — earlier photos of what appears to be the same module were transcribed as "67762523." Digit count doesn't match between the two reads (7 vs 8 digits). Treated as the same physical module (matching chip layout, matching general appearance) but the exact code is unreconciled — flag stands until read directly off the module in hand.
- Faint corner marking "122F" now legible in the clearer shots.
- Standard-length module with an off-center key notch, consistent with a 288-pin DDR4 UDIMM (desktop) form factor rather than SODIMM — this is a stronger read than before but still visual, not pin-counted.
- Still no HyperX/Kingston or any module-brand marking visible anywhere across all seven photos taken of this item.

**Condition:** No visible physical damage. Not tested.

**Next action:** Matthew intends to test this module by POSTing it in the MSI X99S XPOWER AC board (LA-0010). Update this entry with whatever the BIOS reports for brand/capacity/speed once it posts.

---

## LA-0009

**Date logged:** 2026-08-25
**Item:** Intel Pentium G3258, in a clear plastic clamshell tray — corrected from an earlier misread of "G3250"
**Provenance:** Found in a toolbox alongside jewelry/watches and other items (photo: IMG_5443). No retail box, tray only. Matthew recalls purchasing 4 of these units originally — memory, not verified. Only this one has been located and logged so far.

**Verified from die (clearer follow-up photos: IMG_5453, IMG_5452):**
- "Intel(R) Pentium(R) G3258" — correction: the original blurry photo (IMG_5443) was transcribed as "G3250"; these sharper shots make the final digit clearly an 8. G3258 is the unlocked "Anniversary Edition" part, distinct from the locked G3250.
- S-Spec: SR1V0
- "3.20GHz"
- "Costa Rica"
- Batch code: "3420B979" (also a correction — originally misread as "3420H379")
- Haswell, LGA1150, unlocked multiplier

**Condition:** Chip in clamshell tray, no visible damage to pins (not closely inspected). Not tested. Note: this chip's original stock cooler is not with it — per Matthew (2026-08-25), it's currently installed on the i5-2300 board logged as LA-0006.

**Next action:** None. Log if/when installed or tested.

---

## LA-0010

**Date logged:** 2026-08-25
**Item:** MSI X99S XPOWER AC motherboard, CPU installed
**Provenance:** Found assembled as photographed. Matthew intends to POST this board with the mystery DDR4 module (LA-0008) to identify it.

**Verified from board (photos: IMG_5454, IMG_5462, IMG_5456, IMG_5458, IMG_5457):**
- Board silkscreen: "MSI X99S XPOWER AC," "XPOWER," "Audio Boost"
- Socket: LGA2011-3 (consistent with X99 chipset)
- 8x DDR4 DIMM slots (4 per side of socket)
- Multiple PCIe slots (mix of PCIe x16/x8/x1, exact count/spacing not itemized here)
- Onboard power/reset buttons and a 2-digit POST code display on the board edge
- M.2 slot near the lower heatsink
- Board barcode: "E816391914 01001" (label on PCB, likely an assembly/serial tag)

**CPU installed — confirmed:** Die reads "Intel(R) Core(TM) i7-5930K," S-Spec SR20R, 3.50GHz, Costa Rica, batch 3424B375. Haswell-E, LGA2011-3 — consistent with the board's socket. Closed out on the clearer follow-up photos (IMG_5462, IMG_5456, IMG_5458).

**Condition:** Assembled, thermal paste visible on CPU IHS (prior use). Not powered on for this log.

**Next action:** POST test pending — Matthew plans to seat LA-0008's DDR4 module here. Log BIOS-reported RAM identity once it posts, and update LA-0008 accordingly.

---

## LA-0011

**Date logged:** 2026-08-25
**Item:** Kingston HyperX Genesis DDR3 module pair — one with heatspreader intact, one with heatspreader removed. Stated as a matched 2x4GB (8GB) kit.
**Provenance:** Found together, described by Matthew as the same kit. Matthew confirms he personally removed Module 2's heatspreader (not found in that state) — the module wasn't damaged or received bare, its spreader was deliberately pulled. Matthew states with certainty (photos exist) that this kit ran fully populated alongside the Corsair XMS3 kit (currently in LA-0006) in the AM3+ Gigabyte board (LA-0003) for the FX-8350 build. The IIRC hedge applies only to the exact specs/kit-identity detail (2x4GB each, 16GB total), not to the fact that both kits were installed together.

**Module 1 — heatspreader intact, fully verified (photo: IMG_5446):**
- Kingston HyperX Genesis, blue anodized heatspreader
- Full label: KHX1600C9D3/4GETR, ASSY IN CHINA, 1.65V
- Additional label data: 9905403-400.A00LF, 0053853-46X001, YBJM9-B95UQT-YXVPV, lot 7406171B3160, asset tag ASME1671164
- DDR3-1600 CL9, 4GB, non-ECC unbuffered — standard reading of this Kingston part number

**Module 2 — heatspreader removed, chip-level only (photos: IMG_5448, IMG_5451, IMG_5450, IMG_5449):**
- Bare green PCB, no module-level brand/capacity sticker present (it would have been on the removed heatspreader)
- DRAM ICs marked "ELPIDA J2108BCBG DJ-F," with lot codes in the 1124A9002L20 / 1124A9020 range across multiple chips
- Chip count across both faces not confidently determined — photos are partial/angled and don't give a clean full-face count
- Identity as the matching pair to Module 1 (DDR3-1600, 4GB, same kit) is Matthew's testimony — nothing on the bare PCB itself confirms capacity or speed independently

**Condition:** Both modules show handling wear; no damage noted. Not tested.

**Open discrepancy — resolved (2026-08-25):** A photo (IMG_5029) showed two Kingston HyperX modules with both heatspreaders intact, raising the question of a third stick. Checked EXIF metadata directly: all timestamp fields have been stripped from these files (upload pipeline strips DateTimeOriginal/CreateDate; only non-date technical tags remain), so no direct capture-time proof is available. Filename sequence is suggestive — IMG_5029 numbers well below IMG_5446 — and Matthew confirms IMG_5029 is the older photo, predating his removal of Module 2's heatspreader. Resolution: two Kingston sticks total, not three. Module 1 (serial YBJM9-B95UQT-YXVPV) is unchanged. Module 2 was the QNL58-H9LULX-8XVYB stick, spreader intact at the time of IMG_5029, later removed by Matthew — now logged as the bare-PCB "Module 2" above.

**Next action:** If Module 2's capacity/speed needs independent confirmation separately, read it via `dmidecode --type 17` or BIOS once seated in a working system.

---

## LA-0012

**Date logged:** 2026-08-25
**Item:** Corsair Vengeance LP DDR3 module (one stick of a stated 2-stick kit)
**Provenance:** Found among a group of loose RAM sticks ("5 sticks up here in my room," per Matthew). Sibling module not separately photographed in this batch.

**Verified from label (photo: photo.jpeg):**
- CORSAIR, part CML8GX3M2A1600C9
- Label reads "8GB (2x4GB)" — this is the kit-level capacity; this individual stick is one 4GB half of that kit, not 8GB on its own
- DDR3-1600, CL9 (9-9-9-24), 1.50V
- Made in Taiwan, lot 16450494125D474, ver 5.21

**Condition:** No visible damage. Not tested.

**Next action:** Locate and log the matching second stick of this kit if/when found.

---

## LA-0013

**Date logged:** 2026-08-25
**Item:** Kingston HyperX Fury Black DDR3 module, single stick
**Provenance:** Found among the same group of loose RAM sticks as LA-0012.

**Verified from label (photo: photo.jpeg):**
- Kingston HyperX (Fury Black series — "FB" in part number), part HX318C10FB/8
- DDR3-1866, CL10, 8GB (this is a single-module 8GB part, unlike the kit-labeled Corsair above)
- 1.5V, Assy in Taiwan (2)
- Additional label data: 9905403-877.A00LF, lot 0000007033151-P001442, serial Y2JUC-M9MP8N-2V9J3, date code 1528, asset tag CPMM1671507
- Distinct from the HyperX Genesis kit already logged as LA-0011 — different series, speed, and capacity

**Condition:** No visible damage. Not tested.

**Next action:** None.

---

## RAM inventory tally (running note, 2026-08-25)

Per Matthew: 5 loose sticks currently in his room, plus 2 sticks already installed in the LA-0006 board ("downstairs") — 7 accounted for so far, described as a running count, not necessarily final. Matthew confirms LA-0012 (Corsair Vengeance LP) and LA-0013 (Kingston HyperX Fury Black) are 2 of those 5 room sticks — newly logged, not overlapping with anything prior. That leaves 3 more room sticks still to positively identify.

**Tally resolved (2026-08-25):** Matthew confirms the remaining 3 room sticks are the mystery DDR4 (LA-0008, 1 stick) plus the Kingston HyperX Genesis pair (LA-0011, 2 sticks — the blue Genesis-pattern and green-PCB/Elpida sticks in the group photo). Full accounting of the 7:
- Room (5): LA-0012 (Corsair Vengeance LP), LA-0013 (Kingston HyperX Fury Black), LA-0008 (mystery DDR4), LA-0011 Module 1 and Module 2 (Kingston HyperX Genesis pair)
- Downstairs in the LA-0006 board (2): the Corsair XMS3 pair

No sticks remain unidentified. The partial background label in the LA-0012 photo ("HyperX," "2800M...") is still unaccounted for — either a duplicate glimpse of one of the above or a stick outside this count; not pursued further unless it turns out to matter.

**Next action:** None. Tally closed.

---

## LA-0014

**Date logged:** 2026-08-25
**Item:** AMD Athlon II X2 220
**Provenance:** Found, held loose in hand for this photo (IMG_5074). No packaging, no stated context.

**Verified from die:**
- "AMD Athlon(TM) II"
- Part: ADX2200CK22GM
- Batch: CADHC AD 1015GPMW, 9E48142D00566
- Diffused in Germany, Made in Malaysia
- Regor core, socket AM3 (AM2+/AM3 compatible), dual-core, 2.8GHz, 1MB L2 per core (2MB total), 65W TDP — standard spec for this retail part number

**Condition:** IHS side shown, no visible damage. Pin side not photographed. Not tested.

**Next action:** None.

---

## LA-0015

**Date logged:** 2026-08-25
**Item:** ASUS ROG Maximus VII Impact motherboard, Mini-ITX
**Provenance:** Found bare (no box confirmed present — a box edge with an X-shaped logo is visible in the background but not identified as this board's packaging). Sitting on a Magic: The Gathering tournament playmat, which is just the surface, not an inventoried item.

**Verified from board (photos: IMG_3815–3817, IMG_3813–3814):**
- Silkscreen: "ASUS," "MAXIMUS VII IMPACT," ROG logo embossed near socket
- Socket: LGA1150 — places this on Z97 chipset (Haswell/Devil's Canyon generation). Socket empty, no CPU present.
- Memory: 2x DDR3 DIMM slots (red), both empty
- Included daughterboards, both physically present:
  - SupremeFX Impact II Rev 1.00 audio riser card (ASUS SupremeFX chip, AAFP header, "PCB MADE IN CHINA")
  - mPCIe Combo IV card (mSATA + WiFi/BT combo, CE/FCC marked), connected by cable, sitting loose off the board edge
- Rear I/O shield present but detached/loose, not mounted to the board
- Chips visible: Nuvoton Super I/O, ASUS ROG-branded chip

**Condition:** Bare board, no CPU, no RAM, daughterboards present but disconnected/loose in the shots. No visible physical damage. Not tested.

**Cooling:** An EK monoblock (LA-0017) is stated to belong to this board — found separately in the same bin as LA-0016, not physically paired with the board in any photo taken so far.

**Next action:** None.

---

## LA-0016

**Date logged:** 2026-08-25
**Item:** Full-cover GPU waterblock designed for a GTX 670, installed on a reference EVGA GTX 660 Ti.
**Provenance:** Found together, block on card. Same storage bin also contains an Intel Pentium retail box with a stock cooler and a separate acrylic backplate/block, both glimpsed in the background but not the subject of this entry — see note below.

**Verified from photos (IMG_3818–3822):**
- Full-cover waterblock, clear acrylic top, extensive coldplate contact pattern (many circular pads for GPU/VRM/memory contact). Coldplate underside shows dried thermal paste (photo: IMG_3819, per Matthew "its underside").
- Fittings: Koolance-branded chrome compression fittings, confirmed by visible logo. Block manufacturer itself not confirmed — fittings being Koolance doesn't guarantee the block is.
- Short white braided tubing loop connects the fittings; block plumbing not traced further than what's visible.
- Card: PCIe x16 edge connector, "EVGA" silkscreen visible near the connector ("EVGA REV 0" or similar), pink/magenta dot-pattern PCB visible on the back
- Rear bracket (photo: IMG_3822): DVI port, HDMI port, and what appear to be 2x USB-A ports

**Flag — resolved as a misread:** I read the rear bracket as showing 2x USB-A ports alongside DVI and HDMI, which doesn't match reference GTX 660 Ti/670 I/O. Matthew confirms those aren't USB ports — this is a reference EVGA 660 Ti, consistent with standard I/O. My read of IMG_3822 was wrong, likely blur/angle on what's actually part of the DVI/HDMI/DisplayPort cluster. Card and block identity both closed out.

**Condition:** Assembled (block on card), not tested, not powered.

**Next action:** None on the card/block identity. The Pentium box/cooler glimpsed in the background (IMG_3818) isn't logged yet — a separate clean photo would let it get its own entry.

---

## LA-0017

**Date logged:** 2026-08-25
**Item:** EK monoblock, stated by Matthew to be for the ASUS ROG Maximus VII Impact (LA-0015)
**Provenance:** Found in the same storage bin as LA-0016, glimpsed in the background of IMG_3818/IMG_3821 before being identified. Pairing with LA-0015 is Matthew's statement, not independently confirmed by a part-number match — the board itself carries no cooling in its own entry.

**Verified from photo (IMG_3818, background object):**
- Clear acrylic block, embossed circular logo (read as EK per Matthew)
- Multiple mounting/screw points arranged for a socket-area contact pattern, plus what appears to be a separate coldplate/backplate assembly (two distinct acrylic pieces visible stacked)
- No legible model number or SKU text — brand and fitment are Matthew's identification, not read off a label

**Condition:** Loose, unmounted. Not tested with the board.

**Next action:** A clean, direct photo of this block (ideally showing any printed model number) would confirm exact fitment against LA-0015's specific board revision.

---
