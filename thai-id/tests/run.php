<?php

declare(strict_types=1);

// php tests/run.php — plain PHP, no PHPUnit and no Composer install: the
// library is two files with no dependencies, and a test runner would be its
// only one.

require __DIR__ . '/../src/IdCard.php';
require __DIR__ . '/../src/Generator.php';

use ThaiId\Generator;

function ok(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function rejects(callable $call): bool
{
    try {
        $call();
    } catch (InvalidArgumentException) {
        return true;
    }

    return false;
}

// Kept apart from Generator on purpose: literal weights, and the check digit
// as a lookup on the remainder, so the two wraparound cases (0 -> 1, 1 -> 0)
// are written out rather than left to the modulo.
const CHECK_DIGIT = ['1', '0', '9', '8', '7', '6', '5', '4', '3', '2', '1'];

function remainder(string $id): int
{
    $sum = 0;
    foreach ([13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2] as $i => $weight) {
        $sum += (int) $id[$i] * $weight;
    }

    return $sum % 11;
}

$tests = [
    'the check-digit table agrees with worked examples' => function (): void {
        ok(CHECK_DIGIT[remainder('100010000000')] === '1', '13 + 9 = 22, remainder 0');
        ok(CHECK_DIGIT[remainder('100100000000')] === '0', '13 + 10 = 23, remainder 1');
        ok(CHECK_DIGIT[remainder('100000000004')] === '1', '13 + 8 = 21, remainder 10');
    },

    'the README usage: settings chained on the generator, then generate()' => function (): void {
        $generator = new Generator();
        $generator->personType(1)->provinceOfBirth('10')->districtOfBirth('10');
        $idCard = $generator->generate();

        ok($idCard->getType() === '1', 'type');
        ok($idCard->getProvinceOfBirth() === '10', 'province');
        ok($idCard->getDistrictOfBirth() === '10', 'district');
        ok(strlen($idCard->getVolume()) === 5, 'volume is 5 digits');
        ok(strlen($idCard->getNumber()) === 2, 'number is 2 digits');
        ok(strlen($idCard->getCheckDigit()) === 1, 'check digit is 1 digit');
        ok(
            $idCard->getType() . $idCard->getProvinceOfBirth() . $idCard->getDistrictOfBirth()
                . $idCard->getVolume() . $idCard->getNumber() . $idCard->getCheckDigit() === $idCard->getId(),
            'the fields make up the ID',
        );
        ok((string) $idCard === $idCard->getId(), '__toString');
    },

    'defaults are type 1, province 41, district 01' => function (): void {
        ok(str_starts_with((new Generator())->generate()->getId(), '14101'), 'prefix');
    },

    'every ID is 13 digits with the right check digit' => function (): void {
        $seen = [];
        for ($n = 0; $n < 2000; $n++) {
            $prefix = random_int(1, 8) . sprintf('%02d%02d', random_int(0, 99), random_int(0, 99));
            $id = (new Generator())
                ->personType($prefix[0])
                ->provinceOfBirth(substr($prefix, 1, 2))
                ->districtOfBirth(substr($prefix, 3, 2))
                ->generate()
                ->getId();

            ok(preg_match('/^[0-9]{13}\z/', $id) === 1, "13 digits: $id");
            ok(str_starts_with($id, $prefix), "prefix $prefix: $id");
            ok($id[12] === CHECK_DIGIT[remainder($id)], "check digit: $id");
            $seen[remainder($id)] = true;
        }

        // 2000 draws miss a given remainder with probability (10/11)^2000, about 1e-83.
        ok(count($seen) === 11, 'every remainder, the wraparounds 0 and 1 included, was exercised');
    },

    'the volume and number are random' => function (): void {
        $generator = new Generator();
        $ids = [];
        for ($n = 0; $n < 20; $n++) {
            $ids[] = $generator->generate()->getId();
        }

        ok(count(array_unique($ids)) > 1, 'twenty IDs in a row were identical');
    },

    'personType takes 1 to 8, as an int or a string' => function (): void {
        foreach (range(1, 8) as $type) {
            ok((new Generator())->personType($type)->generate()->getType() === (string) $type, "int $type");
            ok((new Generator())->personType((string) $type)->generate()->getType() === (string) $type, "string $type");
        }
    },

    'personType rejects anything else' => function (): void {
        foreach ([0, 9, -1, '0', '9', '01', '1a', '', ' 1', "1\n", '๑'] as $bad) {
            ok(rejects(fn () => (new Generator())->personType($bad)), 'accepted ' . json_encode($bad));
        }
    },

    'provinceOfBirth and districtOfBirth take exactly two ASCII digits' => function (): void {
        foreach (['00', '10', '99'] as $code) {
            ok((new Generator())->provinceOfBirth($code)->generate()->getProvinceOfBirth() === $code, "province $code");
            ok((new Generator())->districtOfBirth($code)->generate()->getDistrictOfBirth() === $code, "district $code");
        }

        foreach (['1', '100', 'ab', '1a', '', ' 10', "10\n", '๑๐'] as $bad) {
            ok(rejects(fn () => (new Generator())->provinceOfBirth($bad)), 'province accepted ' . json_encode($bad));
            ok(rejects(fn () => (new Generator())->districtOfBirth($bad)), 'district accepted ' . json_encode($bad));
        }
    },
];

$failed = 0;
foreach ($tests as $name => $test) {
    try {
        $test();
        echo "ok   $name\n";
    } catch (Throwable $e) {
        $failed++;
        echo "FAIL $name: {$e->getMessage()}\n";
    }
}

echo "\n" . (count($tests) - $failed) . '/' . count($tests) . " passed\n";
exit($failed === 0 ? 0 : 1);
