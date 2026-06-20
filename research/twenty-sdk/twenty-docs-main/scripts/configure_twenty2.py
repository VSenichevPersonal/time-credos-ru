#!/usr/bin/env python3
"""
Configure Twenty CRM - Part 2: Explore Config Variables and Serverless Functions
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

def introspect_config_variable():
    """Introspect ConfigVariable type"""
    query = """
    query {
      __type(name: "ConfigVariable") {
        name
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
    print("ConfigVariable type:")
    print(json.dumps(result, indent=2))
    return result

def introspect_queries():
    """List all available queries"""
    query = """
    query {
      __schema {
        queryType {
          fields {
            name
            description
          }
        }
      }
    }
    """
    result = get_graphql(query)
    queries = result.get('data', {}).get('__schema', {}).get('queryType', {}).get('fields', [])
    print("\n=== Available Queries ===")
    for q in queries:
        name = q['name']
        if 'config' in name.lower() or 'admin' in name.lower() or 'serverless' in name.lower() or 'function' in name.lower():
            print(f"  - {name}: {q.get('description', 'No description')}")
    return queries

def introspect_mutations():
    """List all available mutations"""
    query = """
    query {
      __schema {
        mutationType {
          fields {
            name
            description
          }
        }
      }
    }
    """
    result = get_graphql(query)
    mutations = result.get('data', {}).get('__schema', {}).get('mutationType', {}).get('fields', [])
    print("\n=== Available Mutations (config/function related) ===")
    for m in mutations:
        name = m['name']
        if 'config' in name.lower() or 'admin' in name.lower() or 'serverless' in name.lower() or 'function' in name.lower():
            print(f"  - {name}: {m.get('description', 'No description')}")
    return mutations

def get_config_variables():
    """Get all config variables"""
    query = """
    query GetConfigVariables {
      getConfigVariables {
        groups {
          name
          variables {
            name
            value
            description
            sensitive
            type
            source
          }
        }
      }
    }
    """
    result = get_graphql(query)
    print("\n=== Config Variables ===")
    print(json.dumps(result, indent=2))
    return result

def list_serverless_functions():
    """List serverless functions"""
    query = """
    query {
      findManyServerlessFunctions {
        edges {
          node {
            id
            name
            sourceCodeFullPath
            syncStatus
            runtime
            description
          }
        }
      }
    }
    """
    result = get_graphql(query)
    print("\n=== Serverless Functions ===")
    print(json.dumps(result, indent=2))
    return result

def get_applications():
    """Get all applications"""
    query = """
    query {
      __type(name: "Query") {
        fields {
          name
        }
      }
    }
    """
    # First check if there's an applications query
    result = get_graphql(query)
    fields = result.get('data', {}).get('__type', {}).get('fields', [])
    app_fields = [f['name'] for f in fields if 'app' in f['name'].lower()]
    print("\n=== Application related queries ===")
    print(app_fields)

    # Try to get applications
    app_query = """
    query {
      findManyApplications {
        edges {
          node {
            id
            name
            description
          }
        }
      }
    }
    """
    result = get_graphql(app_query)
    print("\n=== Applications ===")
    print(json.dumps(result, indent=2))
    return result

if __name__ == "__main__":
    print("=== Twenty CRM Configuration Explorer ===\n")

    introspect_config_variable()
    introspect_queries()
    introspect_mutations()
    get_config_variables()
    list_serverless_functions()
    get_applications()
