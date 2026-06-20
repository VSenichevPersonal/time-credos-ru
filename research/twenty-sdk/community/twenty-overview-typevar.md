# Twenty HQ: Unleashing Developer Power for Community-Driven CRM

> Источник: https://typevar.dev/articles/twentyhq/twenty
> Tags: react, javascript, graphql
> Уровень: вводный обзор с примерами кода

---

## Ключевые преимущества Twenty

1. **Accelerated Development** — pre-built foundation, focus on customization
2. **Modern Stack** — React, JavaScript, GraphQL
3. **Open Source & Community Driven** — transparency, flexibility, community support
4. **Extensibility** — integration with other systems, custom modules
5. **Learning Opportunity** — large-scale React/GraphQL application

---

## Installation

### Prerequisites
- Node.js and npm (or Yarn)
- Git
- Docker (optional but recommended)

### Steps

```bash
git clone https://github.com/twentyhq/twenty.git
cd twenty
npm install
cp .env.example .env
docker-compose up -d postgres
npm run migrate
npm run dev
```

Access at `http://localhost:3000`.

---

## Пример: Custom Field "Social Media Profile"

### 1. Определение поля (концептуальная конфигурация)

```json
{
  "entity": "Contact",
  "fields": [
    {
      "name": "socialMediaProfileUrl",
      "type": "URL",
      "label": "Social Media Profile URL",
      "description": "Link to the contact's primary social media profile"
    }
  ]
}
```

### 2. GraphQL Query

```graphql
query GetContactWithSocialMedia($contactId: ID!) {
  contact(id: $contactId) {
    id
    firstName
    lastName
    email
    socialMediaProfileUrl
  }
}
```

### 3. GraphQL Mutation

```graphql
mutation UpdateContactSocialMedia($contactId: ID!, $url: String) {
  updateContact(id: $contactId, input: { socialMediaProfileUrl: $url }) {
    id
    socialMediaProfileUrl
  }
}
```

### 4. React Component (`ContactSocialMediaPanel.jsx`)

```jsx
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_CONTACT_SOCIAL_MEDIA = gql`
  query GetContactSocialMedia($id: ID!) {
    contact(id: $id) {
      id
      socialMediaProfileUrl
    }
  }
`;

const UPDATE_CONTACT_SOCIAL_MEDIA = gql`
  mutation UpdateContactSocialMedia($id: ID!, $url: String) {
    updateContact(id: $id, input: { socialMediaProfileUrl: $url }) {
      id
      socialMediaProfileUrl
    }
  }
`;

function ContactSocialMediaPanel({ contactId }) {
  const { loading, error, data } = useQuery(GET_CONTACT_SOCIAL_MEDIA, {
    variables: { id: contactId },
  });
  const [updateSocialMedia] = useMutation(UPDATE_CONTACT_SOCIAL_MEDIA);
  const [url, setUrl] = useState('');

  React.useEffect(() => {
    if (data?.contact) {
      setUrl(data.contact.socialMediaProfileUrl || '');
    }
  }, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSocialMedia({ variables: { id: contactId, url } });
      alert('Social media URL updated successfully!');
    } catch (err) {
      console.error('Error updating social media:', err);
      alert('Failed to update social media URL.');
    }
  };

  if (loading) return <p>Loading social media...</p>;
  if (error) return <p>Error loading social media: {error.message}</p>;

  return (
    <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
      <h3>Social Media Profile</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter social media URL"
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />
        <button type="submit" style={{
          padding: '10px 15px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Save
        </button>
      </form>
      {url && (
        <p>
          Current: <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
        </p>
      )}
    </div>
  );
}

export default ContactSocialMediaPanel;
```

> **Примечание:** Примеры концептуальные. В реальном Twenty используется Metadata API
> и workspace schema system, а не прямое определение полей в JSON.
