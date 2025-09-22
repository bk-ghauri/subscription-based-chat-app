import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import striptags from 'striptags';

export function MaxTextLength(
  max: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'maxTextLength',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [max],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          const plainText = striptags(value);
          return plainText.length <= args.constraints[0];
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be at most ${args.constraints[0]} characters (excluding HTML tags)`;
        },
      },
    });
  };
}
