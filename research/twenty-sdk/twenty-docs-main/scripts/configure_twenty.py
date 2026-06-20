#!/usr/bin/env python3
"""
Configure Twenty CRM via REST API
"""
import requests
import json
import sys

API_URL = "http://localhost:3000"
API_KEY = "REDACTED_USE_ENV_TWENTY_API_KEY"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def test_api():
    """Test API connectivity"""
    try:
        response = requests.get(f"{API_URL}/rest/companies?limit=1", headers=HEADERS)
        print(f"API Test: {response.status_code}")
        if response.status_code == 200:
            print("✓ API connection successful")
            return True
        else:
            print(f"✗ API error: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Connection error: {e}")
        return False

def get_graphql(query, variables=None):
    """Execute GraphQL query"""
    payload = {"query": query}
    if variables:
        payload["variables"] = variables

    response = requests.post(f"{API_URL}/graphql", headers=HEADERS, json=payload)
    return response.json()

def list_serverless_functions():
    """List all serverless functions"""
    query = """
    query {
      serverlessFunctions {
        edges {
          node {
            id
            name
            sourceCodeFullPath
            syncStatus
          }
        }
      }
    }
    """
    result = get_graphql(query)
    print("\nServerless Functions:")
    print(json.dumps(result, indent=2))
    return result

def create_serverless_function(name, code):
    """Create a new serverless function"""
    mutation = """
    mutation CreateServerlessFunction($input: CreateServerlessFunctionInput!) {
      createOneServerlessFunction(input: $input) {
        id
        name
      }
    }
    """
    variables = {
        "input": {
            "name": name,
            "sourceCodeFullPath": f"src/engine/core-modules/serverless/drivers/twenty-serverless-function.ts"
        }
    }
    result = get_graphql(mutation, variables)
    print(f"\nCreate function result:")
    print(json.dumps(result, indent=2))
    return result

def get_workspace_info():
    """Get workspace information"""
    query = """
    query {
      currentWorkspace {
        id
        displayName
        subdomain
      }
    }
    """
    result = get_graphql(query)
    print("\nWorkspace Info:")
    print(json.dumps(result, indent=2))
    return result

def list_connected_accounts():
    """List connected accounts (email/calendar)"""
    response = requests.get(f"{API_URL}/rest/connectedAccounts", headers=HEADERS)
    print("\nConnected Accounts:")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.status_code} - {response.text}")
    return response

def list_calendar_channels():
    """List calendar channels"""
    response = requests.get(f"{API_URL}/rest/calendarChannels", headers=HEADERS)
    print("\nCalendar Channels:")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.status_code} - {response.text}")
    return response

def list_message_channels():
    """List message channels (email)"""
    response = requests.get(f"{API_URL}/rest/messageChannels", headers=HEADERS)
    print("\nMessage Channels:")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.status_code} - {response.text}")
    return response

def introspect_schema():
    """Introspect GraphQL schema"""
    query = """
    query {
      __schema {
        types {
          name
          kind
        }
      }
    }
    """
    result = get_graphql(query)
    types = result.get('data', {}).get('__schema', {}).get('types', [])
    admin_types = [t for t in types if 'config' in t['name'].lower() or 'admin' in t['name'].lower() or 'setting' in t['name'].lower()]
    print("\nAdmin/Config related types:")
    for t in admin_types[:20]:
        print(f"  - {t['name']} ({t['kind']})")
    return result

if __name__ == "__main__":
    print("=== Twenty CRM Configuration Script ===\n")

    if not test_api():
        sys.exit(1)

    # Get workspace info
    get_workspace_info()

    # List connected accounts
    list_connected_accounts()

    # List channels
    list_calendar_channels()
    list_message_channels()

    # Introspect for config types
    introspect_schema()

    # List serverless functions
    list_serverless_functions()
