#!/usr/bin/env python3
"""Get ALL config variables - final version"""
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
    groups {
      name
      description
      isHiddenOnLoad
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

result = get_graphql(query)

if 'data' in result and result['data']['getConfigVariablesGrouped']:
    groups = result['data']['getConfigVariablesGrouped']['groups']
    print("=== ALL Configuration Groups ===\n")

    google_vars = []

    for group in groups:
        print(f"\n{'='*60}")
        print(f"GROUP: {group['name']}")
        print(f"Description: {group['description']}")
        print(f"{'='*60}")

        for var in group.get('variables', []):
            name = var['name']
            value = var['value']
            if var['isSensitive']:
                value = "***SENSITIVE***"

            # Collect Google-related variables
            if any(x in name for x in ['GOOGLE', 'GMAIL', 'CALENDAR', 'MESSAGING']):
                google_vars.append(var)

            print(f"\n  {name}")
            print(f"    Value: {value}")
            print(f"    Source: {var['source']}")
            print(f"    EnvOnly: {var['isEnvOnly']}")
            print(f"    Type: {var['type']}")

    # Summary of Google vars
    print(f"\n\n{'='*60}")
    print("=== GOOGLE / MESSAGING / CALENDAR VARIABLES ===")
    print(f"{'='*60}")
    for var in google_vars:
        name = var['name']
        value = var['value'] if not var['isSensitive'] else "***SENSITIVE***"
        print(f"\n{name}")
        print(f"  Value: {value}")
        print(f"  EnvOnly: {var['isEnvOnly']}")
        print(f"  Source: {var['source']}")

else:
    print("Error or no data:")
    print(json.dumps(result, indent=2))
