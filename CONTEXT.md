# CalendarCN

CalendarCN is an open-source calendar registry for React apps that use shadcn/ui. It exists so teams can install scheduling source into their own product instead of embedding a black-box calendar widget.

## Language

**CalendarCN**:
An open-source shadcn-compatible calendar registry with composed and primitive scheduling options.
_Avoid_: calendar app, hosted scheduler

**Primitive Path**:
The default install path where teams add the core calendar surface and optional add-ons as editable source.
_Avoid_: primitive calendar, low-level version

**Starter Path**:
The composed install path that includes the full CalendarCN interaction flow.
_Avoid_: demo, template-only version

**Social Preview**:
The public title, description, and image that represent CalendarCN when the homepage is shared.
_Avoid_: OGs, share stuff

## Relationships

- **CalendarCN** offers exactly one **Primitive Path** and one **Starter Path**
- A **Social Preview** represents **CalendarCN** outside the product surface

## Example Dialogue

> **Dev:** "Should the Facebook card say Primitive Calendar?"
> **Domain expert:** "No, the social preview represents CalendarCN. The primitive path is only one install option."

## Flagged Ambiguities

- "OGs" was used to mean the full **Social Preview**: Open Graph tags, Twitter card tags, canonical URL, and crawler-readable preview image.
