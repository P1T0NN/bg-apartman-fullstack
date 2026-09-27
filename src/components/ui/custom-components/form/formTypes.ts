// TYPES
import type { Snippet } from 'svelte';
import type { HTMLInputAttributes } from 'svelte/elements';
import type { FunctionArgs, FunctionReference } from 'convex/server';
import type { ZodType } from 'zod';
import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';

export type FormFieldValue = string | number | boolean;
export type FormValue =
	FormFieldValue | null | undefined | bigint | ArrayBuffer | FormValue[] | FormValues;
export type FormValues = { [name: string]: FormValue };
export type FormSchema = ZodType<FormValues>;
export type MutationValues<Mutation extends FunctionReference<'mutation' | 'action'>> =
	ExtraFields<Mutation> & FormValues;
export type ExtraFields<Mutation extends FunctionReference<'mutation' | 'action'>> = Partial<
	Omit<FunctionArgs<Mutation>, 'uploadedFiles' | 'retainedFiles' | 'turnstileToken'>
>;

export type UploadContext = {
	uploadedFiles: string[];
	retainedFiles: string[];
	uploadFiles: PreviewFile[];
};

export type FormFieldContext<Value = FormFieldValue> = {
	values: Record<string, Value | undefined>;
	errors: Record<string, string>;
	getValue: (name: string) => Value | undefined;
	setValue: (name: string, value: Value | undefined) => void;
	inputValue: (name: string) => string;
	checkboxValue: (name: string) => boolean;
	numberValue: (name: string, fallback?: number) => number;
	disabled: boolean;
};

export type BaseField = {
	/** Dot-separated object path, e.g. shippingAddress.street. */
	name: string;
	label?: string;
	description?: string;
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	/** Extra classes for the wrapping <Field>. */
	class?: string;
};

export type FormSection = {
	kind: 'section';
	/** Card title shown above the grouped fields. */
	title?: string;
	description?: string;
	fields: FieldConfig[];
	/** Extra classes for the wrapping <Card>. */
	class?: string;
};

export type CustomFieldContext = FormFieldContext<unknown> & {
	field: CustomField;
	error?: string;
};

export type CustomField = BaseField & {
	kind: 'custom';
	/** Custom control rendered inside the standard field wrapper. */
	render: Snippet<[CustomFieldContext]>;
};

export type InputField = BaseField & {
	kind: 'input';
	type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'search' | 'tel' | 'url';
	min?: string | number;
	max?: string | number;
	step?: string | number;
	autocomplete?: HTMLInputAttributes['autocomplete'];
	inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
	maxLength?: number;
};

export type TextareaField = BaseField & { kind: 'textarea'; rows?: number };

export type SelectField = BaseField & {
	kind: 'select';
	options: { value: string; label: string }[];
};

export type CheckboxField = BaseField & { kind: 'checkbox' };

export type CounterField = BaseField & {
	kind: 'counter';
	/** Lower bound; also the displayed value until the user changes it. */
	min?: number;
	max?: number;
};

export type UploadMode = 'single' | 'multiple';

export type UploadField = BaseField & {
	kind: 'upload';
	/** Single file by default; use `multiple` to allow several images. */
	mode?: UploadMode;
	/** Accepted file types. */
	accept?: string;
};

export type FormControlField =
	InputField | TextareaField | SelectField | CheckboxField | CounterField;
export type FieldConfig = FormControlField | FormSection | UploadField | CustomField;

export type CustomFields<Value = FormValue> = Snippet<[FormFieldContext<Value>]>;
