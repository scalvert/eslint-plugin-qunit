/**
 * @fileoverview forbid assert.throws() with block, string, and message args
 * @author Kevin Partington
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const assert = require("assert"),
    utils = require("../utils");

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

function getAssertVar(testStack) {
    assert.ok(testStack && testStack.length);

    return testStack[testStack.length - 1].assertVar;
}

function isThrows(calleeNode, assertVar) {
    let result = false;

    /* istanbul ignore else: correctly returns false */
    if (calleeNode.type === "MemberExpression") {
        result = calleeNode.object.type === "Identifier" &&
            calleeNode.object.name === assertVar &&
            calleeNode.property.type === "Identifier" &&
            ["throws", "raises"].indexOf(calleeNode.property.name) !== -1;
    } else if (calleeNode.type === "Identifier") {
        result = calleeNode.name === "throws";
    }

    return result;
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "forbid assert.throws() with block, string, and message args",
            category: "Possible errors"
        },
        messages: {
            noThrowsWithString: "Do not use {{callee}}(block, string, string)."
        },
        schema: []
    },

    create: function (context) {
        const testStack = [],
            sourceCode = context.getSourceCode();

        function checkAndReport(callExprNode) {
            const args = callExprNode.arguments,
                argCount = args.length;

            if (argCount > 2 && args[1].type === "Literal" && typeof args[1].value === "string") {
                context.report({
                    node: callExprNode,
                    messageId: "noThrowsWithString",
                    data: {
                        callee: sourceCode.getText(callExprNode.callee)
                    }
                });
            }
        }

        return {
            "CallExpression": function (node) {
                if (utils.isTest(node.callee)) {
                    testStack.push({
                        assertVar: utils.getAssertContextNameForTest(node.arguments)
                    });
                } else if (testStack.length && isThrows(node.callee, getAssertVar(testStack))) {
                    checkAndReport(node);
                }
            },

            "CallExpression:exit": function (node) {
                if (utils.isTest(node.callee)) {
                    testStack.pop();
                }
            }
        };
    }

};
