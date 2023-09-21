import { TextField as MaterialTextField } from 'react-md';

import { withDefaultProps, withFakeId, withFormikField } from './shared';

export default /**
 * <TextField />
 * See react-md TextField component: https://react-md.mlaursen.com/components/text-fields
 *
 * This wrapper aims to define in one place the default settings we use for select fields across the app to avoid
 * repetition and to keep consistency:
 *
 * - Set some default props
 * - Add `setFieldValue` for convenience using Formik
 *
 * We need to make sure we don't change the behavior or meaning of any prop described in the original documentation.
 *
 * @deprecated Use material-ui components
 */
withFakeId(withFormikField(withDefaultProps(MaterialTextField, { lineDirection: 'center', type: 'text' })));
