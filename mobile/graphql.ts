export const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';

export async function fetchGraphQL(query: string, variables: any = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  return json.data;
}

export const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password)
  }
`;

export const GET_ME_QUERY = `
  query {
    me {
      id
      name
    }
  }
`;

export const GET_EVENTS_QUERY = `
  query {
    events {
      id
      name
    }
  }
`;

export const GET_EVENT_QUERY = `
  query Event($id: ID!) {
    event(id: $id) {
      id
      name
      location
    }
  }
`;
