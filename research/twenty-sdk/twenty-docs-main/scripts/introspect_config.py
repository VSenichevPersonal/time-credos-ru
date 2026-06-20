#!/usr/bin/env python3
"""Introspect config types"""
import requests
import json

API_URL = "http://localhost:3000"
API_KEY = "REDACTED_USE_ENV_TWENTY_API_KEY"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def get_graphql(query, variables=None):
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    response = requests.post(f"{API_URL}/graphql", headers=HEADERS, json=payload)
    return response.json()

# Introspect ConfigVariablesOutput
query = """
query {
  __type(name: "ConfigVariablesOutput") {
    name
    kind
    fields {
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
result = get_graphql(query)
print("=== ConfigVariablesOutput Type ===")
print(json.dumps(result, indent=2))

# Introspect ConfigVariablesGroupData
query2 = """
query {
  __type(name: "ConfigVariablesGroupData") {
    name
    kind
    fields {
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
result2 = get_graphql(query2)
print("\n=== ConfigVariablesGroupData Type ===")
print(json.dumps(result2, indent=2))

# Now try to get config with correct structure
query3 = """
query {
  getConfigVariablesGrouped {
    groups {
      name
      description
      isHiddenOnAdminPanel
      variables {
        name
        value
        description
        isSensitive
        source
        isEnvOnly
        type
      }
    }
  }
}
"""
result3 = get_graphql(query3)
print("\n=== Config Variables (with groups field) ===")
print(json.dumps(result3, indent=2)[:3000])
