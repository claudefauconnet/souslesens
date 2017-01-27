var xx = {
	"type" : "Program",
	"body" : [ {
		"type" : "VariableDeclaration",
		"declarations" : [ {
			"type" : "VariableDeclarator",
			"id" : {
				"type" : "Identifier",
				"name" : "xx",
				"range" : [ 4, 6 ]
			},
			"init" : {
				"type" : "Identifier",
				"name" : "a",
				"range" : [ 7, 8 ]
			},
			"range" : [ 4, 8 ]
		} ],
		"kind" : "var",
		"range" : [ 0, 9 ]
	}, {
		"type" : "FunctionDeclaration",
		"id" : {
			"type" : "Identifier",
			"name" : "initDBs",
			"range" : [ 19, 26 ]
		},
		"params" : [],
		"body" : {
			"type" : "BlockStatement",
			"body" : [ {
				"type" : "VariableDeclaration",
				"declarations" : [ {
					"type" : "VariableDeclarator",
					"id" : {
						"type" : "Identifier",
						"name" : "dbs",
						"range" : [ 36, 39 ]
					},
					"init" : {
						"type" : "CallExpression",
						"callee" : {
							"type" : "Identifier",
							"name" : "proxy_getDBNames",
							"range" : [ 42, 58 ]
						},
						"arguments" : [ {
							"type" : "Literal",
							"value" : "admin",
							"raw" : "\"admin\"",
							"range" : [ 59, 66 ]
						}, {
							"type" : "Literal",
							"value" : "admin",
							"raw" : "'admin'",
							"range" : [ 68, 75 ]
						}, {
							"type" : "ObjectExpression",
							"properties" : [],
							"range" : [ 77, 79 ]
						} ],
						"range" : [ 42, 80 ]
					},
					"range" : [ 36, 80 ]
				} ],
				"kind" : "var",
				"range" : [ 32, 81 ]
			}, {
				"type" : "ForStatement",
				"init" : {
					"type" : "VariableDeclaration",
					"declarations" : [ {
						"type" : "VariableDeclarator",
						"id" : {
							"type" : "Identifier",
							"name" : "i",
							"range" : [ 92, 93 ]
						},
						"init" : {
							"type" : "Literal",
							"value" : 0,
							"raw" : "0",
							"range" : [ 96, 97 ]
						},
						"range" : [ 92, 97 ]
					} ],
					"kind" : "var",
					"range" : [ 88, 97 ]
				},
				"test" : {
					"type" : "BinaryExpression",
					"operator" : "<",
					"left" : {
						"type" : "Identifier",
						"name" : "i",
						"range" : [ 99, 100 ]
					},
					"right" : {
						"type" : "MemberExpression",
						"computed" : false,
						"object" : {
							"type" : "Identifier",
							"name" : "dbs",
							"range" : [ 103, 106 ]
						},
						"property" : {
							"type" : "Identifier",
							"name" : "length",
							"range" : [ 107, 113 ]
						},
						"range" : [ 103, 113 ]
					},
					"range" : [ 99, 113 ]
				},
				"update" : {
					"type" : "UpdateExpression",
					"operator" : "++",
					"argument" : {
						"type" : "Identifier",
						"name" : "i",
						"range" : [ 115, 116 ]
					},
					"prefix" : false,
					"range" : [ 115, 118 ]
				},
				"body" : {
					"type" : "BlockStatement",
					"body" : [ {
						"type" : "VariableDeclaration",
						"declarations" : [ {
							"type" : "VariableDeclarator",
							"id" : {
								"type" : "Identifier",
								"name" : "str",
								"range" : [ 128, 131 ]
							},
							"init" : {
								"type" : "MemberExpression",
								"computed" : false,
								"object" : {
									"type" : "MemberExpression",
									"computed" : true,
									"object" : {
										"type" : "Identifier",
										"name" : "dbs",
										"range" : [ 134, 137 ]
									},
									"property" : {
										"type" : "Identifier",
										"name" : "i",
										"range" : [ 138, 139 ]
									},
									"range" : [ 134, 140 ]
								},
								"property" : {
									"type" : "Identifier",
									"name" : "name",
									"range" : [ 141, 145 ]
								},
								"range" : [ 134, 145 ]
							},
							"range" : [ 128, 145 ]
						} ],
						"kind" : "var",
						"range" : [ 124, 146 ]
					}, {
						"type" : "ExpressionStatement",
						"expression" : {
							"type" : "CallExpression",
							"callee" : {
								"type" : "MemberExpression",
								"computed" : false,
								"object" : {
									"type" : "CallExpression",
									"callee" : {
										"type" : "Identifier",
										"name" : "$",
										"range" : [ 149, 150 ]
									},
									"arguments" : [ {
										"type" : "Literal",
										"value" : "#dbSelect",
										"raw" : "\"#dbSelect\"",
										"range" : [ 151, 162 ]
									} ],
									"range" : [ 149, 163 ]
								},
								"property" : {
									"type" : "Identifier",
									"name" : "append",
									"range" : [ 164, 170 ]
								},
								"range" : [ 149, 170 ]
							},
							"arguments" : [ {
								"type" : "CallExpression",
								"callee" : {
									"type" : "Identifier",
									"name" : "$",
									"range" : [ 171, 172 ]
								},
								"arguments" : [ {
									"type" : "Literal",
									"value" : "<option/>",
									"raw" : "'<option/>'",
									"range" : [ 173, 184 ]
								}, {
									"type" : "ObjectExpression",
									"properties" : [ {
										"type" : "Property",
										"key" : {
											"type" : "Identifier",
											"name" : "value",
											"range" : [ 191, 196 ]
										},
										"computed" : false,
										"value" : {
											"type" : "Identifier",
											"name" : "str",
											"range" : [ 199, 202 ]
										},
										"kind" : "init",
										"method" : false,
										"shorthand" : false,
										"range" : [ 191, 202 ]
									}, {
										"type" : "Property",
										"key" : {
											"type" : "Identifier",
											"name" : "text",
											"range" : [ 207, 211 ]
										},
										"computed" : false,
										"value" : {
											"type" : "Identifier",
											"name" : "str",
											"range" : [ 214, 217 ]
										},
										"kind" : "init",
										"method" : false,
										"shorthand" : false,
										"range" : [ 207, 217 ]
									} ],
									"range" : [ 186, 221 ]
								} ],
								"range" : [ 171, 222 ]
							} ],
							"range" : [ 149, 223 ]
						},
						"range" : [ 149, 224 ]
					} ],
					"range" : [ 120, 227 ]
				},
				"range" : [ 83, 227 ]
			} ],
			"range" : [ 29, 229 ]
		},
		"generator" : false,
		"expression" : false,
		"range" : [ 10, 229 ]
	} ],
	"sourceType" : "script",
	"range" : [ 0, 229 ]
}