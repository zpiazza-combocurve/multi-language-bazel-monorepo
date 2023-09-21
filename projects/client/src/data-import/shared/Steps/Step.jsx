import styled from 'styled-components';

import { Section, SectionContent, SectionFooter, SectionHeader } from '@/layouts/Section';

export const Step = Section;

export const StepHeader = SectionHeader;

export const StepBody = SectionContent;

export const StepFooter = styled(SectionFooter)`
	display: flex;
	justify-content: flex-end;
	padding: 0.75rem 1rem;
`;
