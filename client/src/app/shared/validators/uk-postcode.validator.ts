import { AbstractControl, ValidatorFn } from '@angular/forms';

export function ukPostcodeValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    const pattern = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
    return pattern.test(control.value ?? '') ? null : { invalidPostcode: true };
  };
}
