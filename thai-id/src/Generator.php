<?php

declare(strict_types=1);

namespace ThaiId;

use InvalidArgumentException;

/**
 * Random Thai citizen ID numbers that pass the check-digit test, for test data.
 *
 * Setters change this object and return it rather than returning a copy: the
 * documented usage chains them, discards the result, and then calls generate()
 * on the original variable, so a copy would silently drop every setting.
 */
final class Generator
{
    // The defaults of farzai/thai-citizen-id-validation, whose API this is:
    // type 1, Udon Thani (41), Mueang district (01).
    private string $personType = '1';

    private string $provinceOfBirth = '41';

    private string $districtOfBirth = '01';

    /** ประเภทบุคคล: one digit, 1 to 8. */
    public function personType(int|string $personType): self
    {
        $personType = (string) $personType;

        // \z, not $: $ also matches before a trailing newline, so "1\n" would pass.
        if (!preg_match('/^[1-8]\z/', $personType)) {
            throw new InvalidArgumentException('Person type must be one digit from 1 to 8.');
        }

        $this->personType = $personType;

        return $this;
    }

    /** เลขจังหวัดที่เกิด: two digits, e.g. '10' for Bangkok. */
    public function provinceOfBirth(string $provinceOfBirth): self
    {
        if (!preg_match('/^[0-9]{2}\z/', $provinceOfBirth)) {
            throw new InvalidArgumentException('Province of birth must be two digits.');
        }

        $this->provinceOfBirth = $provinceOfBirth;

        return $this;
    }

    /** เลขอำเภอที่เกิด: two digits. */
    public function districtOfBirth(string $districtOfBirth): self
    {
        if (!preg_match('/^[0-9]{2}\z/', $districtOfBirth)) {
            throw new InvalidArgumentException('District of birth must be two digits.');
        }

        $this->districtOfBirth = $districtOfBirth;

        return $this;
    }

    public function generate(): IdCard
    {
        $id = $this->personType . $this->provinceOfBirth . $this->districtOfBirth
            . sprintf('%07d', random_int(0, 9_999_999)); // volume (5) and number (2)

        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $sum += (int) $id[$i] * (13 - $i);
        }

        // Remainders 0 and 1 would give 11 and 10; the final % 10 makes them 1 and 0.
        return new IdCard($id . ((11 - ($sum % 11)) % 10));
    }
}
