#!/usr/bin/env python3
"""
Configure Twenty CRM - Part 3: Correct queries
"""
import requests
import json

API_URL = "http://localhost:3000"
API_KEY = "REDACTED_USE_ENV_TWENTY_API_KEY"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def get_graphql(query, variables=None):
    """Execute GraphQL query"""
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    response = requests.post(f"{API_URL}/graphql", headers=HEADERS, json=payload)
    return response.json()

def get_config_variables_grouped():
    """Get all config variables grouped"""
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
    print("\n=== Config Variables Grouped ===")

    if 'data' in result and result['data']['getConfigVariablesGrouped']:
        for group in result['data']['getConfigVariablesGrouped']:
            print(f"\n--- Group: {group['name']} ---")
            if group.get('description'):
                print(f"    Description: {group['description']}")
            for var in group.get('variables', []):
                name = var['name']
                value = var['value']
                source = var['source']
                is_sensitive = var['isSensitive']
                # Show Google-related or key configuration
                if 'GOOGLE' in name or 'GMAIL' in name or 'CALENDAR' in name or 'MESSAGING' in name or 'AUTH' in name:
                    if is_sensitive:
                        print(f"    {name}: ***SENSITIVE*** (source: {source})")
                    else:
                        print(f"    {name}: {value} (source: {source})")
    else:
        print(json.dumps(result, indent=2))
    return result

def get_google_config():
    """Get Google-specific config"""
    query = """
    query {
      getConfigVariablesGrouped {
        name
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
    print("\n=== GOOGLE / MESSAGING / CALENDAR Config ===")

    if 'data' in result and result['data']['getConfigVariablesGrouped']:
        for group in result['data']['getConfigVariablesGrouped']:
            for var in group.get('variables', []):
                name = var['name']
                if 'GOOGLE' in name or 'GMAIL' in name or 'CALENDAR' in name or 'MESSAGING' in name:
                    value = '***' if var['isSensitive'] else var['value']
                    print(f"  {name}: {value}")
                    print(f"    - Source: {var['source']}, EnvOnly: {var['isEnvOnly']}, Type: {var['type']}")
                    print(f"    - Description: {var['description']}")
                    print()
    return result

def introspect_serverless_function():
    """Introspect ServerlessFunction type"""
    query = """
    query {
      __type(name: "ServerlessFunction") {
        name
        fields {
          name
          type {
            name
            kind
          }
        }
      }
    }
    """
    result = get_graphql(query)
    print("\n=== ServerlessFunction Type ===")
    print(json.dumps(result, indent=2))
    return result

def list_serverless_functions():
    """List serverless functions correctly"""
    query = """
    query {
      findManyServerlessFunctions {
        id
        name
        sourceCodeFullPath
        syncStatus
        runtime
        description
      }
    }
    """
    result = get_graphql(query)
    print("\n=== Serverless Functions ===")
    print(json.dumps(result, indent=2))
    return result

def list_applications():
    """List applications correctly"""
    query = """
    query {
      findManyApplications {
        id
        name
        description
      }
    }
    """
    result = get_graphql(query)
    print("\n=== Applications ===")
    print(json.dumps(result, indent=2))
    return result

def introspect_application():
    """Introspect Application type"""
    query = """
    query {
      __type(name: "Application") {
        name
        fields {
          name
          type {
            name
            kind
          }
        }
      }
    }
    """
    result = get_graphql(query)
    print("\n=== Application Type ===")
    print(json.dumps(result, indent=2))
    return result

if __name__ == "__main__":
    print("=== Twenty CRM Configuration - Correct Queries ===\n")

    get_google_config()
    introspect_serverless_function()
    list_serverless_functions()
    introspect_application()
    list_applications()
