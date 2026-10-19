# Thai ID generator

Random Thai citizen ID numbers that pass the check-digit test, for filling in
forms and fixtures. PHP 8.1+, no dependencies.

```php
use ThaiId\Generator;

$generator = new Generator();

// Optional: the defaults are type 1, province 41, district 01
$generator
    ->personType(1)          // ประเภทบุคคล, 1 to 8
    ->provinceOfBirth('10')  // เลขจังหวัดที่เกิด, two digits
    ->districtOfBirth('10'); // เลขอำเภอที่เกิด, two digits

$idCard = $generator->generate();

echo $idCard;                       // 11010, seven random digits, check digit
echo $idCard->getId();              // the same 13 digits
echo $idCard->getType();            // 1
echo $idCard->getProvinceOfBirth(); // 10
echo $idCard->getDistrictOfBirth(); // 10
echo $idCard->getVolume();          // 5 digits
echo $idCard->getNumber();          // 2 digits
echo $idCard->getCheckDigit();      // 1 digit
```

Any other value for a setter throws `InvalidArgumentException`. One ID from the
repository root:

```bash
php -r 'require "thai-id/src/IdCard.php"; require "thai-id/src/Generator.php"; echo (new ThaiId\Generator())->generate(), "\n";'
```

Every number passes the checksum, so any of them may belong to a real person.
Use them as test data, never as anyone's ID on a real sign-up.

## Where the API comes from

It is the `Generator` of
[farzai/thai-citizen-id-validation](https://github.com/farzai/thai-citizen-id-validation-php)
(that is the Composer name; `farzai/thai-id-validation`, which its namespace
suggests, is not on Packagist). Code written against it needs its `use` line
changed to `ThaiId\`, and any `Result` type hint changed to `IdCard`.

The difference is that inputs are checked. Version 1.3.0 checks only the
length of the province and district, and only the value of the person type, so:

| Call | farzai 1.3.0 returns | Here |
|---|---|---|
| `personType('01')` | a 14-digit ID | throws |
| `personType('1abc')` | 16 characters, letters included | throws |
| `provinceOfBirth('ab')` | an ID with letters in it | throws |
| `districtOfBirth("1\n")` | an ID with a newline in it | throws |

The sample output in its README, `1410100100000`, fails that package's own
validator (the last digit should be 1), and it starts with the defaults' `14101`,
not the `11010` that the `'10'`, `'10'` settings shown beside it give. Do not
copy it into a fixture as a valid ID.

## Using it

From another Composer project in this repository:

```json
{
    "repositories": [{ "type": "path", "url": "../thai-id" }],
    "require": { "eoinmcgee1993/thai-id": "@dev" }
}
```

Without Composer, require `src/IdCard.php` and `src/Generator.php`.

## Test

```bash
php tests/run.php   # 8 tests
```

No PHPUnit and no install step: the library is two files with no dependencies,
and a test runner would be its only one.
