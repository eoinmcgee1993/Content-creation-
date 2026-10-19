<?php

declare(strict_types=1);

namespace ThaiId;

/**
 * An ID from Generator, read field by field. The 13 digits are laid out as
 *
 *   T PP DD VVVVV NN C
 *
 * type, province, district, volume, number within the volume, check digit.
 */
final class IdCard
{
    public function __construct(private readonly string $id)
    {
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getType(): string
    {
        return substr($this->id, 0, 1);
    }

    public function getProvinceOfBirth(): string
    {
        return substr($this->id, 1, 2);
    }

    public function getDistrictOfBirth(): string
    {
        return substr($this->id, 3, 2);
    }

    public function getVolume(): string
    {
        return substr($this->id, 5, 5);
    }

    public function getNumber(): string
    {
        return substr($this->id, 10, 2);
    }

    public function getCheckDigit(): string
    {
        return substr($this->id, 12, 1);
    }

    public function __toString(): string
    {
        return $this->id;
    }
}
