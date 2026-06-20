#!/usr/bin/env python3
"""
Deploy Stripe Synchronizer App to Twenty
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

def graphql(query, variables=None):
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    response = requests.post(f"{API_URL}/graphql", headers=HEADERS, json=payload)
    return response.json()

def get_function_source_code(function_id):
    """Get source code of a serverless function"""
    query = """
    query GetServerlessFunctionSourceCode($input: GetServerlessFunctionSourceCodeInput!) {
      getServerlessFunctionSourceCode(input: $input)
    }
    """
    variables = {"input": {"id": function_id}}
    result = graphql(query, variables)
    print("=== Function Source Code Structure ===")
    print(json.dumps(result, indent=2))
    return result

def introspect_update_mutation():
    """Introspect UpdateServerlessFunctionInput"""
    query = """
    query {
      __type(name: "UpdateServerlessFunctionInput") {
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
    print("\n=== UpdateServerlessFunctionInput ===")
    print(json.dumps(result, indent=2))
    return result

def introspect_publish_mutation():
    """Introspect PublishServerlessFunctionInput"""
    query = """
    query {
      __type(name: "PublishServerlessFunctionInput") {
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
    print("\n=== PublishServerlessFunctionInput ===")
    print(json.dumps(result, indent=2))
    return result

# Read the TypeScript files
TYPES_TS = '''export type stripeStatus = 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'PAUSED';

type stripeItem = {
  quantity: number;
};

type stripeItemsData = {
  data: stripeItem[];
};

type stripeEventObject = {
  customer: string;
  items: stripeItemsData;
  status: stripeStatus;
  quantity: number | null;
};

type stripeEventData = {
  object: stripeEventObject;
};

export type stripeEvent = {
  data: stripeEventData;
  type: string;
};

export type stripeCustomer = {
  businessName?: string;
  name: string | null;
  email: string | null;
};

export type twentyObject = {
  id: string;
  nameSingular: string;
  fields: Record<string, any>[];
};
'''

def create_stripe_function():
    """Create the Stripe serverless function"""

    # First, create the function
    mutation = """
    mutation CreateServerlessFunction($input: CreateServerlessFunctionInput!) {
      createOneServerlessFunction(input: $input) {
        id
        name
        description
        handlerPath
        handlerName
        latestVersion
      }
    }
    """

    variables = {
        "input": {
            "name": "stripe-webhook",
            "description": "Stripe webhook handler - syncs Stripe subscription data to Twenty CRM",
            "timeoutSeconds": 30,
            "handlerName": "main",
            "handlerPath": "src/index.ts"
        }
    }

    result = graphql(mutation, variables)
    print("\n=== Create Stripe Function Result ===")
    print(json.dumps(result, indent=2))

    if 'errors' in result:
        print("Error creating function")
        return None

    function_id = result['data']['createOneServerlessFunction']['id']
    print(f"\nFunction created with ID: {function_id}")

    return function_id

def update_function_code(function_id):
    """Update the function with source code"""
    # Read the main code file
    with open('/Users/jacob/Downloads/twenty/packages/twenty-apps/community/stripe-synchronizer/src/index.ts', 'r') as f:
        index_ts = f.read()

    with open('/Users/jacob/Downloads/twenty/packages/twenty-apps/community/stripe-synchronizer/src/types.ts', 'r') as f:
        types_ts = f.read()

    # The code format is likely a map of file paths to content
    code = {
        "src/index.ts": index_ts,
        "src/types.ts": types_ts
    }

    mutation = """
    mutation UpdateServerlessFunction($input: UpdateServerlessFunctionInput!) {
      updateOneServerlessFunction(input: $input) {
        id
        name
        latestVersion
      }
    }
    """

    variables = {
        "input": {
            "id": function_id,
            "code": code
        }
    }

    result = graphql(mutation, variables)
    print("\n=== Update Function Code Result ===")
    print(json.dumps(result, indent=2))
    return result

def publish_function(function_id):
    """Publish the function"""
    mutation = """
    mutation PublishServerlessFunction($input: PublishServerlessFunctionInput!) {
      publishServerlessFunction(input: $input) {
        id
        name
        latestVersion
        publishedVersions
      }
    }
    """

    variables = {
        "input": {
            "id": function_id
        }
    }

    result = graphql(mutation, variables)
    print("\n=== Publish Function Result ===")
    print(json.dumps(result, indent=2))
    return result

def list_functions():
    """List all serverless functions"""
    query = """
    query {
      findManyServerlessFunctions {
        id
        name
        description
        latestVersion
        publishedVersions
        handlerPath
        handlerName
        routeTriggers {
          id
          path
          httpMethod
          isAuthRequired
        }
        cronTriggers {
          id
          pattern
        }
        databaseEventTriggers {
          id
          eventName
        }
      }
    }
    """
    result = graphql(query)
    print("\n=== All Functions ===")
    print(json.dumps(result, indent=2))
    return result

if __name__ == "__main__":
    print("=== Stripe Synchronizer Deployment ===\n")

    # First, list existing functions
    list_functions()

    # Introspect mutations
    introspect_update_mutation()
    introspect_publish_mutation()

    # Check if test function exists, get its source
    print("\n=== Checking test function source code ===")
    get_function_source_code("69819bee-0028-478e-8c9a-bc28df10ddf3")

    # Create the stripe function
    # function_id = create_stripe_function()
    # if function_id:
    #     update_function_code(function_id)
    #     publish_function(function_id)
