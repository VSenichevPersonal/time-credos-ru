#!/usr/bin/env python3
"""Debug config query"""
import requests
import json

API_URL = "http://localhost:3000"
API_KEY = "REDACTED_USE_ENV_TWENTY_API_KEY"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

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

payload = {"query": query}
response = requests.post(f"{API_URL}/graphql", headers=HEADERS, json=payload)
print(f"Status: {response.status_code}")
print(f"Response: {response.text[:5000]}")
