#!/usr/bin/env python3
"""
Deploy Twenty Apps via GraphQL API
"""
import requests
import json
import sys
import os

API_URL = "http://localhost:3000"
API_KEY = "REDACTED_USE_ENV_TWENTY_API_KEY"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def graphql(query, variables=None):
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    response = requests.post(f"{API_URL}/graphql", headers=HEADERS, json=payload)
    return response.json()

def list_serverless_functions():
    """List all serverless functions"""
    query = """
    query {
      findManyServerlessFunctions {
        id
        name
        description
        runtime
        timeoutSeconds
        latestVersion
        handlerPath
        handlerName
      }
    }
    """
    result = graphql(query)
    print("=== Current Serverless Functions ===")
    print(json.dumps(result, indent=2))
    return result

def introspect_create_function_mutation():
    """Introspect the createOneServerlessFunction mutation"""
    query = """
    query {
      __type(name: "CreateServerlessFunctionInput") {
        name
        inputFields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
    """
    result = graphql(query)
    print("\n=== CreateServerlessFunctionInput Type ===")
    print(json.dumps(result, indent=2))
    return result

def introspect_mutation():
    """Get the mutation signature"""
    query = """
    query {
      __schema {
        mutationType {
          fields(includeDeprecated: false) {
            name
            args {
              name
              type {
                name
                kind
                ofType {
                  name
                  kind
                }
              }
            }
          }
        }
      }
    }
    """
    result = graphql(query)
    mutations = result.get('data', {}).get('__schema', {}).get('mutationType', {}).get('fields', [])

    print("\n=== Serverless Function Mutations ===")
    for m in mutations:
        if 'serverless' in m['name'].lower() or 'function' in m['name'].lower():
            print(f"\n{m['name']}:")
            for arg in m.get('args', []):
                arg_type = arg['type']
                type_name = arg_type.get('name') or arg_type.get('ofType', {}).get('name')
                print(f"  - {arg['name']}: {type_name}")

    return result

def create_serverless_function(name, description, code):
    """Create a new serverless function"""
    mutation = """
    mutation CreateServerlessFunction($input: CreateServerlessFunctionInput!) {
      createOneServerlessFunction(input: $input) {
        id
        name
        description
      }
    }
    """
    variables = {
        "input": {
            "name": name,
            "description": description
        }
    }
    result = graphql(mutation, variables)
    print(f"\n=== Create Function Result: {name} ===")
    print(json.dumps(result, indent=2))
    return result

if __name__ == "__main__":
    print("=== Twenty App Deployment via API ===\n")

    # List current functions
    list_serverless_functions()

    # Introspect available mutations
    introspect_create_function_mutation()
    introspect_mutation()

    # Try creating a simple test function
    print("\n=== Attempting to create test function ===")
    create_serverless_function(
        "test-function",
        "A test serverless function",
        "export const main = async () => { return { message: 'Hello from test function' }; };"
    )
