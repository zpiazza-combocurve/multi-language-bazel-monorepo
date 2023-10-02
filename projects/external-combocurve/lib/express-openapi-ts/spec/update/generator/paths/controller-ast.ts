/**
 * TypeScript AST scan of controller files
 */
import path from 'path';
import * as ts from 'typescript';

interface IControllerTypeInfo {
	name: string;
	isArray: boolean;
	union: IControllerTypeInfo[] | null;
}

const getUnionInfo = (node: ts.Node, sourceFile: ts.SourceFile) =>
	node
		.getChildAt(0, sourceFile)
		.getChildren(sourceFile)
		.filter((child) => ts.SyntaxKind[child.kind] !== 'BarToken')
		.map((child) => getControllerTypeInfo(child, sourceFile));

const getControllerTypeInfo = (node: ts.Node | null, sourceFile: ts.SourceFile): IControllerTypeInfo | null => {
	if (!node) {
		return null;
	}
	const isUnion = ts.isUnionTypeNode(node);
	const isArray = ts.isArrayTypeNode(node);
	let name;
	let union = null;

	if (isUnion) {
		union = getUnionInfo(node, sourceFile);
		name = union.map((info: IControllerTypeInfo) => info.name).join('Or');
	} else if (isArray) {
		name = node.getChildAt(0, sourceFile).getText(sourceFile);
	} else {
		name = node.getText(sourceFile);
	}
	return {
		isArray,
		name,
		union,
	};
};

const processReqParameterType = (node: ts.Node, sourceFile: ts.SourceFile) => {
	const children = [];
	node.forEachChild((child) => {
		children.push(child);
	});
	const [typeRequest, typeParams, typeResponseBody, typeRequestBody, typeRequestQuery] = children;

	if (typeRequest && ts.isIdentifier(typeRequest) && typeRequest.getText(sourceFile) === 'Request') {
		return {
			typeParams: getControllerTypeInfo(typeParams, sourceFile),
			typeResponseBody: getControllerTypeInfo(typeResponseBody, sourceFile),
			typeRequestBody: getControllerTypeInfo(typeRequestBody, sourceFile),
			typeRequestQuery: getControllerTypeInfo(typeRequestQuery, sourceFile),
		};
	}
	return null;
};

const processResParameterType = (node: ts.Node, sourceFile: ts.SourceFile) => {
	const children: ts.Node[] = [];
	node.forEachChild((child) => {
		children.push(child);
	});
	const [typeRequest, typeResponseBody] = children;

	if (typeRequest && ts.isIdentifier(typeRequest) && typeRequest.getText(sourceFile) === 'Response') {
		return {
			typeResponseBody: getControllerTypeInfo(typeResponseBody, sourceFile),
		};
	}
	return null;
};

const processReqParameter = (node: ts.Node, sourceFile: ts.SourceFile) => {
	if (node.getChildCount(sourceFile) < 3) {
		return null;
	}
	return processReqParameterType(node.getChildAt(2, sourceFile), sourceFile);
};

const processResParameter = (node: ts.Node, sourceFile: ts.SourceFile) => {
	if (node.getChildCount(sourceFile) < 3) {
		return null;
	}
	return processResParameterType(node.getChildAt(2, sourceFile), sourceFile);
};

const processExportedFunction = (node: ts.Node, sourceFile: ts.SourceFile) => {
	const params = [];
	node.forEachChild((child) => {
		if (ts.SyntaxKind[child.kind] === 'Parameter') {
			params.push(child);
		}
	});
	if (params.length === 2) {
		const [reqNode, resNode] = params;
		return {
			...processReqParameter(reqNode, sourceFile),
			...processResParameter(resNode, sourceFile),
		};
	}
	return null;
};

const processFunction = (node: ts.Node, sourceFile: ts.SourceFile) => {
	let isExport = false;
	let name = null;
	node.forEachChild((child) => {
		switch (ts.SyntaxKind[child.kind]) {
			case 'ExportKeyword':
				isExport = true;
				break;
			case 'Identifier':
				name = child.getText(sourceFile);
				break;
		}
	});
	if (isExport) {
		const info = processExportedFunction(node, sourceFile);
		return info ? { ...info, name } : null;
	}
	return null;
};

const processTopLevelNode = (node: ts.Node, sourceFile: ts.SourceFile) => {
	if (ts.isFunctionDeclaration(node)) {
		return processFunction(node, sourceFile);
	}
	return null;
};

const processModule = (sourceFile: ts.SourceFile) => {
	const controllers = [];
	sourceFile.forEachChild((child) => {
		const controllerInfo = processTopLevelNode(child, sourceFile);
		if (controllerInfo) {
			controllers.push(controllerInfo);
		}
	});
	return controllers.reduce(
		(accumulator, controllerInfo) => ({ ...accumulator, [controllerInfo.name]: controllerInfo }),
		{},
	);
};

export const getControllerInfo = (tsFileName: string) => {
	const tsconfig = 'tsconfig.json';
	const json = ts.parseConfigFileTextToJson(tsconfig, ts.sys.readFile(tsconfig));
	const { options } = ts.parseJsonConfigFileContent(json.config, ts.sys, path.dirname(tsconfig));

	const rootFiles = [tsFileName];
	const program = ts.createProgram(rootFiles, options);
	const sourceFile = program.getSourceFile(tsFileName);
	return processModule(sourceFile);
};
