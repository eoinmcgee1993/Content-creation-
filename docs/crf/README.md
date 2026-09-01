# CRF site documentation

Three documents, written to be read in this order.

| File | What it answers |
|---|---|
| [`SYSTEM.md`](SYSTEM.md) | What was built and how it works — products, geometry, data model, and where each rule is actually enforced |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | What happens next — phases from here to launch, with gates, verification and rollback |
| [`BLUEPRINT.md`](BLUEPRINT.md) | How to rebuild it from nothing. Written to be fed to a language model or an automation connector |
| [`blueprint.json`](blueprint.json) | The same plan as structured data: parameters, resources, ordered steps, assertions, invariants |

None of these files contains a secret or a live identifier. Account names,
project references and the deploy token's location are in the private
infrastructure sheet, which is deliberately not in this repository.
