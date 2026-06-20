#!/usr/bin/env python3
"""Get ALL config variables"""
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

query = """
query {
  getConfigVariablesGrouped {
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
"""

result = get_graphql(query)

if 'data' in result and result['data']['getConfigVariablesGrouped']:
    print("=== ALL Configuration Groups ===\n")
    for group in result['data']['getConfigVariablesGrouped']:
        print(f"\n{'='*60}")
        print(f"GROUP: {group['name']}")
        print(f"Hidden: {group.get('isHiddenOnAdminPanel', False)}")
        print(f"{'='*60}")
        for var in group.get('variables', []):
            name = var['name']
            value = var['value']
            if var['isSensitive']:
                value = "***SENSITIVE***"
            print(f"\n  {name}")
            print(f"    Value: {value}")
            print(f"    Source: {var['source']}")
            print(f"    EnvOnly: {var['isEnvOnly']}")
            print(f"    Type: {var['type']}")
else:
    print("Error or no data:")
    print(json.dumps(result, indent=2))
