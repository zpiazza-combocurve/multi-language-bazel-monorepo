from combocurve.science.network_module.parser.tokens import TokenType, Token
from combocurve.science.network_module.parser.nodes import (AllNodesTyping, NumberNode, AddNode, SubtractNode,
                                                            MultiplyNode, DivideNode, PositiveNode, NegativeNode,
                                                            StreamNode, FunctionCallNode)


class SyntaxError(Exception):
    expected = True


class Parser:
    '''
    See https://www.youtube.com/playlist?list=PLZQftyCk7_Sdu5BFaXB_jLeJ9C78si5_3 for detail

    Grammar:
    expr ::= term [ +|- term]*
    term ::= factor [ *|/ factor]*
    factor ::= ( expr ) | function_call | stream | number | + factor | - factor
    function_call ::= function_handle ( number )
    '''
    def __init__(self, tokens):
        self.tokens = tokens
        self.current_index = -1
        self.current_token: None | Token = None
        self.advance()

    def raise_error(self):
        raise SyntaxError("Invalid syntax")

    def advance(self):
        self.current_index += 1
        if self.current_index < len(self.tokens):
            self.current_token = self.tokens[self.current_index]
        else:
            self.current_token = None

    def parse(self) -> AllNodesTyping:
        '''
        Get the AST for the tokens.
        Get an expression, if there's more tokens left after the expression, then there must be syntax error
        '''
        ## try to get an expression, if there's more
        result: AllNodesTyping = self.expr()

        if self.current_token is not None:
            self.raise_error()

        return result

    def expr(self) -> AllNodesTyping:
        result: AllNodesTyping = self.term()

        while self.current_token is not None and self.current_token.token_type in (TokenType.PLUS, TokenType.MINUS):
            if self.current_token.token_type == TokenType.PLUS:
                self.advance()
                result = AddNode(result, self.term())
            elif self.current_token.token_type == TokenType.MINUS:
                self.advance()
                result = SubtractNode(result, self.term())

        return result

    def term(self) -> AllNodesTyping:
        result: AllNodesTyping = self.factor()

        while self.current_token is not None and self.current_token.token_type in (TokenType.MULTIPLY,
                                                                                   TokenType.DIVIDE):
            if self.current_token.token_type == TokenType.MULTIPLY:
                self.advance()
                result = MultiplyNode(result, self.factor())
            elif self.current_token.token_type == TokenType.DIVIDE:
                self.advance()
                result = DivideNode(result, self.factor())

        return result

    def factor(self) -> AllNodesTyping:
        token = self.current_token
        if self.current_token is None:
            self.raise_error()

        if token.token_type == TokenType.LPAREN:
            self.advance()
            result = self.expr()

            if self.current_token.token_type != TokenType.RPAREN:
                self.raise_error()

            self.advance()
            return result
        elif token.token_type == TokenType.FUNCTION_HANDLE:
            return self.function_call_factor()
        elif token.token_type == TokenType.STREAM:
            self.advance()
            return StreamNode(token.value)
        elif token.token_type == TokenType.NUMBER:
            self.advance()
            return NumberNode(token.value)

        elif token.token_type == TokenType.PLUS:
            self.advance()
            return PositiveNode(self.factor())

        elif token.token_type == TokenType.MINUS:
            self.advance()
            return NegativeNode(self.factor())
        else:
            self.raise_error()

    def function_call_factor(self) -> FunctionCallNode:
        function_handle_token = self.current_token

        ## should give left paren
        self.advance()

        if self.current_token.token_type != TokenType.LPAREN:
            self.raise_error()

        ## should give number
        self.advance()
        function_input_node = self.function_input()

        ## should give right paren
        self.advance()
        if self.current_token.token_type != TokenType.RPAREN:
            self.raise_error()

        ## advance and return
        self.advance()

        return FunctionCallNode(function_handle_token.value, function_input_node)

    def function_input(self) -> NumberNode:
        ## improve this to allow more stuff
        if self.current_token.token_type is TokenType.NUMBER:
            return NumberNode(self.current_token.value)

        else:
            self.raise_error()
