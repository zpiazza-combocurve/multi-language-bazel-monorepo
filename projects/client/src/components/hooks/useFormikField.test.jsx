import { renderHook } from '@testing-library/react-hooks';

import { useFormikField } from './useFormikField';

describe('hooks/useFormikField', () => {
	test('setFieldValue', () => {
		const setFieldValue = vi.fn();
		const onChange = vi.fn();
		const { result } = renderHook(() => useFormikField({ onChange, setFieldValue, name: 'email' }));
		result.current.onChange('user@inpt.com');
		expect(setFieldValue).toHaveBeenCalledWith('email', 'user@inpt.com');
		expect(onChange).toHaveBeenCalledWith('user@inpt.com');
	});
	test('field', () => {
		let handleChange = vi.fn();
		let handleBlur = vi.fn();
		let field = {
			onChange: vi.fn(() => handleChange),
			onBlur: vi.fn(() => handleBlur),
			name: 'email',
			value: 'user@inpt.com',
		};
		let form = { setFieldValue: vi.fn() };

		const { result } = renderHook(() => useFormikField({ field, form }));
		expect(result.current.name).toEqual(field.name);
		expect(result.current.value).toEqual(field.value);

		result.current.onChange('user2@inpt.com');
		expect(form.setFieldValue).toHaveBeenCalledWith(field.name, 'user2@inpt.com');

		result.current.onBlur();
		expect(handleBlur).toHaveBeenCalled();
	});
	test('format and parse', () => {
		const handleChange = vi.fn();
		const handleBlur = vi.fn();
		const field = {
			onChange: vi.fn(() => handleChange),
			onBlur: vi.fn(() => handleBlur),
			name: 'case',
			value: 'TEXTCASE',
		};
		const form = { setFieldValue: vi.fn() };
		const format = (text) => text.toLowerCase();
		const parse = (text) => text.toUpperCase();
		const { result } = renderHook(() => useFormikField({ field, form, format, parse }));
		expect(result.current.value).toBe('textcase');
		result.current.onChange('changed textcase');
		expect(form.setFieldValue).toHaveBeenCalledWith(field.name, 'CHANGED TEXTCASE');
	});
});
