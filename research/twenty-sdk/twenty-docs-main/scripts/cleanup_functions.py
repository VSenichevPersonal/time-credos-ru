#!/usr/bin/env python3
"""Clean up duplicate and test functions"""
import requests
import json

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

def delete_function(function_id):
    """Delete a serverless function"""
    mutation = """
    mutation DeleteServerlessFunction($input: ServerlessFunctionIdInput!) {
      deleteOneServerlessFunction(input: $input) {
        id
        name
      }
    }
    """
    variables = {"input": {"id": function_id}}
    result = graphql(mutation, variables)
    return result

# Delete duplicates and test function
functions_to_delete = [
    ("e5104a5f-9e8a-482e-baf3-c999e677329f", "stripe-synchronizer-main (duplicate)"),
    ("69819bee-0028-478e-8c9a-bc28df10ddf3", "test-function"),
]

for func_id, name in functions_to_delete:
    result = delete_function(func_id)
    if 'errors' in result:
        print(f"Error deleting {name}: {result['errors']}")
    else:
        print(f"Deleted: {name}")

# List remaining functions
query = """
query {
  findManyServerlessFunctions {
    id
    name
    latestVersion
  }
}
"""
result = graphql(query)
print("\n=== Remaining Functions ===")
for f in result.get('data', {}).get('findManyServerlessFunctions', []):
    print(f"  - {f['name']} (version: {f['latestVersion']})")
