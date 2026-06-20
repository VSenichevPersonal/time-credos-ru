#!/usr/bin/env python3
"""
Deploy Twenty Apps via GraphQL API - Final Version
"""
import requests
import json
import os
import sys

API_URL = "http://localhost:3000"
API_KEY = "REDACTED_USE_ENV_TWENTY_API_KEY"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

APPS_DIR = "/Users/jacob/Downloads/twenty/packages/twenty-apps/community"

def graphql(query, variables=None):
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    response = requests.post(f"{API_URL}/graphql", headers=HEADERS, json=payload)
    return response.json()

def introspect_update_input():
    """Introspect UpdateServerlessFunctionInputUpdates"""
    query = """
    query {
      __type(name: "UpdateServerlessFunctionInputUpdates") {
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
    print("=== UpdateServerlessFunctionInputUpdates ===")
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
      }
    }
    """
    result = graphql(query)
    return result.get('data', {}).get('findManyServerlessFunctions', [])

def create_function(name, description, timeout_seconds=30):
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
            "description": description,
            "timeoutSeconds": timeout_seconds
        }
    }
    result = graphql(mutation, variables)
    if 'errors' in result:
        print(f"Error creating function {name}: {result['errors']}")
        return None
    return result['data']['createOneServerlessFunction']

def update_function_code(function_id, name, code):
    """Update function source code"""
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
            "update": {
                "name": name,
                "code": code
            }
        }
    }
    result = graphql(mutation, variables)
    if 'errors' in result:
        print(f"Error updating function code: {result['errors']}")
        return None
    return result['data']['updateOneServerlessFunction']

def publish_function(function_id):
    """Publish a function"""
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
    if 'errors' in result:
        print(f"Error publishing function: {result['errors']}")
        return None
    return result['data']['publishServerlessFunction']

def read_app_files(app_dir):
    """Read all TypeScript files from an app directory and format as code object"""
    code = {}

    # Check if there's a src directory
    src_dir = os.path.join(app_dir, 'src')
    if os.path.exists(src_dir):
        src_code = {}
        for root, dirs, files in os.walk(src_dir):
            for file in files:
                if file.endswith('.ts') or file.endswith('.js'):
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, src_dir)
                    with open(file_path, 'r') as f:
                        src_code[rel_path] = f.read()
        code['src'] = src_code

    # Check for serverlessFunctions directory
    sf_dir = os.path.join(app_dir, 'serverlessFunctions')
    if os.path.exists(sf_dir):
        for func_name in os.listdir(sf_dir):
            func_dir = os.path.join(sf_dir, func_name)
            if os.path.isdir(func_dir):
                func_src = os.path.join(func_dir, 'src')
                if os.path.exists(func_src):
                    func_code = {}
                    for file in os.listdir(func_src):
                        if file.endswith('.ts') or file.endswith('.js'):
                            file_path = os.path.join(func_src, file)
                            with open(file_path, 'r') as f:
                                func_code[file] = f.read()
                    code[f'serverlessFunctions/{func_name}/src'] = func_code

    # Add .env placeholder
    code['.env'] = '# Add your environment variables here\n'

    return code

def deploy_app(app_name):
    """Deploy a single app"""
    print(f"\n{'='*60}")
    print(f"Deploying: {app_name}")
    print(f"{'='*60}")

    app_dir = os.path.join(APPS_DIR, app_name)

    # Read app config
    config_file = os.path.join(app_dir, 'application.config.ts')
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            config_content = f.read()
        print(f"Found application.config.ts")
    else:
        print(f"No application.config.ts found")
        return None

    # Read source files
    code = read_app_files(app_dir)
    print(f"Found {len(code)} code entries")

    # Create the function
    func = create_function(
        name=f"{app_name}-main",
        description=f"Main function for {app_name} app",
        timeout_seconds=30
    )

    if not func:
        return None

    print(f"Created function: {func['id']}")

    # Update with code
    func_name = f"{app_name}-main"
    updated = update_function_code(func['id'], func_name, code)
    if updated:
        print(f"Updated function with code, version: {updated.get('latestVersion')}")

    # Publish
    published = publish_function(func['id'])
    if published:
        print(f"Published function, versions: {published.get('publishedVersions')}")

    return func

def main():
    print("=== Twenty Apps Deployment ===\n")

    # First introspect the update input
    introspect_update_input()

    # List existing functions
    print("\n=== Existing Functions ===")
    functions = list_functions()
    for f in functions:
        print(f"  - {f['name']} (id: {f['id']})")

    # List available apps
    print("\n=== Available Apps ===")
    apps = [d for d in os.listdir(APPS_DIR) if os.path.isdir(os.path.join(APPS_DIR, d))]
    for app in apps:
        print(f"  - {app}")

    # Deploy all apps (except linkedin-browser-extension which is a browser extension, not serverless)
    apps_to_deploy = [
        'stripe-synchronizer',
        'fireflies',
        'rollup-engine',
        'last-email-interaction',
        'meeting-transcript',
        'ai-meeting-transcript',
        'mailchimp-synchronizer',
        'webmetic',
        'activity-summary'
    ]

    for app in apps_to_deploy:
        try:
            deploy_app(app)
        except Exception as e:
            print(f"Error deploying {app}: {e}")

    # List functions again
    print("\n=== Functions After Deployment ===")
    functions = list_functions()
    for f in functions:
        print(f"  - {f['name']} (id: {f['id']}, version: {f.get('latestVersion')})")

if __name__ == "__main__":
    main()
