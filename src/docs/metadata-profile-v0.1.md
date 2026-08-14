# Forgotten Industries Metadata Profile v0.1

Status: deferred interoperability crosswalk

Authority: Matthew Taylor Marx / Forgotten Industries

Applies to: canonical YAML records, public archive shelves, source documents,
process records, object records, dossier records, field logs, voice logs,
recovered social evidence, and future L'Archive box records.

Depends on: `src/data/taxonomy.yml` and `classification-system.md`

## Purpose

This profile records possible interoperability mappings for Forgotten
Industries. It does not define the institution's taxonomy and should not drive a
record migration until the native FI authority in `src/data/taxonomy.yml` has
stabilized through actual use.

The working rule is:

```text
FI language is defined, applied, and tested first.
Standards language is added later as an explicit crosswalk.
```

## External Crosswalk Targets

### First Crosswalk Candidates

Evaluate these standards after the FI public layers, record families, evidence
states, and lifecycle vocabulary are stable:

- Dublin Core Metadata Terms for baseline descriptive metadata:
  `title`, `creator`, `date`, `description`, `type`, `identifier`, `subject`,
  `source`, `rights`, and `relation`.
  Reference: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/
- Describing Archives: A Content Standard (DACS) for archival description
  practice: reference code, title, dates, extent, scope and content,
  arrangement, access and use, custodial history, source of acquisition, and
  description control.
  Reference: https://saa-ts-dacs.github.io/
- PREMIS for preservation metadata: fixity, preservation events, file/object
  identity, agents, rights basis, and long-term preservation actions.
  Reference: https://www.loc.gov/standards/premis/
- W3C PROV-O for provenance chains: entity, activity, agent, attribution,
  generation, derivation, and source use.
  Reference: https://www.w3.org/TR/prov-o/

### Second-Pass Target

Use Records in Contexts / RiC-O as the target model for a later graph-capable
pass, not as the first working schema.

RiC-O is appropriate when the archive needs richer links between records,
instantiations, agents, activities, sequences, hierarchies, and record sets.
Reference: https://www.ica.org/standards/RiC/ontology

Use CIDOC CRM only as a later cultural-heritage integration reference. It is
valuable but too heavy for the first sweep.
Reference: https://cidoc-crm.org/

Use IIIF Presentation API later when the archive needs standard manifests for
ordered image, scan, audio, or transcript presentation.
Reference: https://iiif.io/api/presentation/3.0/

## Record Families

| FI record family          | Current source                     | Public layer                  | Standards role                                                               |
| ------------------------- | ---------------------------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| Dossier                   | `src/data/projects.yml`            | L'OEUVRE / Les Dossiers       | DACS description, Dublin Core resource                                       |
| Object/component          | `src/data/inventory.yml`           | L'ARCHIVE                     | DACS item/object description, PREMIS object where digital evidence exists    |
| ATLAS report / field log  | `src/data/field-logs.yml`          | LE SIGNAL / L'OEUVRE          | Dublin Core text resource, PROV-O generated/attributed record                |
| Voice field journal       | `src/data/voice-logs.yml`          | LE SIGNAL                     | Dublin Core sound/text resource, PREMIS file, PROV-O transcription activity  |
| Recovered social evidence | `src/data/social-posts.yml`        | L'ARCHIVE                     | Dublin Core source/evidence record, PROV-O derivation from external platform |
| Source document           | `src/docs/**`                      | L'ARCHIVE / source records    | DACS source/control note, PREMIS evidence package where hashed               |
| L'Archive box             | `intake/LE-BOX-*` before promotion | L'ARCHIVE when public-cleared | DACS container/item record, PREMIS fixity package, future RiC-O record set   |

## Canonical FI Fields

These are the stable first-pass fields for new or revised archive records.
Existing records may use legacy names until migrated.

### Identity

| FI field         | Meaning                                                      | Standards mapping                                                   |
| ---------------- | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| `id`             | Durable FI identifier                                        | DACS reference code; `dcterms:identifier`; future `rico:identifier` |
| `slug`           | Public URL slug where applicable                             | Local access path; `dcterms:identifier` when URL-like               |
| `title` / `name` | Human-readable record title                                  | DACS title; `dcterms:title`                                         |
| `record_type`    | Dossier, object, field log, voice log, source set, box, file | `dcterms:type`; future RiC-O class                                  |
| `public_layer`   | L'ARCHIVE, L'OEUVRE, LE SIGNAL, A PROPOS                     | Local classification; DACS arrangement note                         |

### Description

| FI field            | Meaning                              | Standards mapping                                             |
| ------------------- | ------------------------------------ | ------------------------------------------------------------- |
| `summary`           | Short public description             | `dcterms:description`; DACS scope/content                     |
| `scope_and_content` | Longer archival description          | DACS scope/content; `dcterms:description`                     |
| `category`          | Broad local category                 | `dcterms:subject`; future SKOS concept                        |
| `tags` / `themes`   | Search and browse terms              | `dcterms:subject`; future SKOS concepts                       |
| `condition`         | Physical or operational condition    | DACS physical access/condition note; PREMIS preservation note |
| `status`            | Preserved narrative state note       | DACS description control note                                 |
| `lifecycle_state`   | Controlled archive/publication stage | DACS description control; FI lifecycle authority              |

### Dates

| FI field              | Meaning                         | Standards mapping                                        |
| --------------------- | ------------------------------- | -------------------------------------------------------- |
| `date`                | Primary public date             | `dcterms:date`                                           |
| `date_logged`         | Date recorded into FI           | DACS description control; PROV-O activity date           |
| `started` / `revived` | Dossier lifecycle dates         | `dcterms:created` / `dcterms:date`; PROV-O activity date |
| `recorded_at`         | Voice/audio recording timestamp | `dcterms:created`; PREMIS event date                     |
| `generated_at`        | Generated output timestamp      | PROV-O generation; PREMIS event date                     |

### Agents

| FI field          | Meaning                                               | Standards mapping                                        |
| ----------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| `creator`         | Original creator where known                          | `dcterms:creator`; DACS creator                          |
| `operator`        | Person who documented or handled the record           | PROV-O agent; DACS description control                   |
| `human_authority` | Matthew's authority/review role                       | PROV-O attribution; AI citation standard                 |
| `system`          | Technical, institutional, or operating system context | `dcterms:subject`; future RiC-O activity/system relation |
| `recorder`        | Device or method used for voice capture               | PREMIS agent/object; PROV-O used entity                  |

### Provenance And Source

| FI field             | Meaning                                | Standards mapping                                        |
| -------------------- | -------------------------------------- | -------------------------------------------------------- |
| `source_path`        | Local source document or evidence path | `dcterms:source`; PROV-O used entity                     |
| `source_links`       | Source references and roles            | `dcterms:source`; `dcterms:relation`; PROV-O used entity |
| `origin`             | Acquisition, storage, or context note  | DACS custodial history/source of acquisition             |
| `custodial_history`  | Known custody before and within FI     | DACS custodial history; PROV-O provenance                |
| `associated_project` | Linked dossier or system               | `dcterms:relation`; future RiC-O relation                |
| `relations`          | Explicit related records               | `dcterms:relation`; future RiC-O object properties       |

### Preservation And Fixity

| FI field              | Meaning                                                  | Standards mapping                                   |
| --------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| `files`               | Digital files belonging to the record                    | PREMIS object/file                                  |
| `photos`              | Public-safe image evidence                               | PREMIS object/file; IIIF candidate canvas resource  |
| `audio`               | Public-safe audio evidence                               | PREMIS object/file; IIIF candidate content resource |
| `sha256`              | SHA-256 digest of a file or manifest                     | PREMIS fixity                                       |
| `hash_algorithm`      | Digest algorithm used                                    | PREMIS message digest algorithm                     |
| `manifest_hash`       | Digest of a record package or manifest                   | PREMIS fixity; PROV-O generated entity              |
| `preservation_events` | Hashing, migration, redaction, publication, verification | PREMIS event; PROV-O activity                       |

### Access, Rights, And Sensitivity

| FI field           | Meaning                                                         | Standards mapping                                        |
| ------------------ | --------------------------------------------------------------- | -------------------------------------------------------- |
| `rights`           | Rights statement or license                                     | `dcterms:rights`; DACS conditions governing use          |
| `rights_holder`    | Rights holder where known                                       | `dcterms:rightsHolder`                                   |
| `access`           | Public, restricted, private, local-only                         | `dcterms:accessRights`; DACS conditions governing access |
| `public_clearance` | Publication decision state                                      | Local safety field; DACS access/use note                 |
| `sensitivity`      | Privacy, identity, medical, location, credential, or other risk | Local safety field; `dcterms:accessRights`               |
| `redaction_status` | None, pending, redacted, summarized                             | PREMIS event; PROV-O activity                            |

### Uncertainty

| FI field               | Meaning                                      | Standards mapping                                           |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| `certainty`            | Confirmed, probable, possible, unknown       | DACS description control note; future confidence vocabulary |
| `identification_basis` | Evidence used for an identification          | PROV-O used entity; DACS source note                        |
| `open_questions`       | Unresolved questions                         | DACS notes                                                  |
| `provisional`          | Whether the record is explicitly provisional | DACS description control; local status vocabulary           |

## FI Authority Boundary

The canonical public layers, record families, evidence states, and lifecycle
terms live only in `src/data/taxonomy.yml`. This crosswalk must reference those
identifiers rather than maintain a second controlled list.

Access, public clearance, sensitivity, redaction, certainty, condition, fixity,
and preservation events remain operational metadata controls. They should not
be collapsed into the four public taxonomy axes.

## FI-First Sweep

The first pass should be conservative and non-destructive.

1. Assign the native FI `public_layer` and `record_type` to new or materially
   revised index records.
2. Keep evidence state separate from lifecycle, condition, custody, and access.
3. Preserve category, tag, system, and narrative status language as discovery
   vocabulary until an explicit alias or migration record exists.
4. Identify missing safety fields: `access`, `public_clearance`,
   `sensitivity`, and `redaction_status`.
5. Identify missing preservation fields: `sha256`, `hash_algorithm`,
   `manifest_hash`, and `preservation_events`.
6. Do not rename public routes, legacy implementation fields, preserved source
   text, or evidence files during this pass.
7. Delay external field mapping until the FI assignments are coherent and
   useful on the website.

## Later Crosswalk Target

After the FI taxonomy stabilizes, choose a target export shape.

Recommended target:

```text
FI Metadata Crosswalk v0.2
  -> Dublin Core compatible descriptive export
  -> PREMIS-inspired fixity and preservation-event block
  -> PROV-O-inspired provenance-event block
  -> RiC-O-ready relation vocabulary
```

Do not attempt full RiC-O RDF until the local profile is stable. The useful
intermediate target is a structured JSON/YAML profile that can later be exported
to RDF, IIIF manifests, or another standards layer.

## Public Rule

No private intake becomes public because it fits the profile.

Standards alignment improves description, provenance, and preservation. It does
not override public-clearance review.
