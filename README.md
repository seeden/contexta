# contexta

A React-inspired Context API for Node.js with async/await support.
Supported in nodejs, bun, and deno via async-local-storage.

## Usage

Imagine you want to access the currently authenticated user across various functions without passing the user object through every function parameter. With contexta, you can effortlessly manage and access contextual data throughout your Node.js application, even in asynchronous workflows.

### Create a Context

Create a context for the viewer (currently authenticated user). This context will hold the user information and provide a way to access it throughout your application.

```ts
// ViewerContext.ts
import createContext from 'contexta';

type User = {
  id: string;
  name: string;
};

const ViewerContext = createContext<User | null>(null);

export default ViewerContext;
```


### Create a Hook to Access the Context

```ts
// useViewer.ts
import useContext from 'contexta';
import ViewerContext from './ViewerContext';

export default function useViewer(): User | null {
  return useContext(ViewerContext);
}
```

### Integrate contexta with Express Middleware

Set up an Express middleware that loads the viewer from the request (e.g., from an authorization header) and sets it in the context. This ensures that the user information is accessible throughout the request lifecycle without manually passing it to every function.

```ts
// server.ts
import express from 'express';
import ViewerContext from './ViewerContext';
import useViewer from './useViewer';
import { performAction } from './someService';

const app = express();
const port = 3000;

async function fetchUserByToken(token: string): Promise<User | null> {
  // Simulate a database lookup
  if (token === 'valid-token') {
    return { id: '1', name: 'Alice' };
  }
  return null;
}

app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let viewer: User | null = null;

  if (authHeader) {
    viewer = await fetchUserByToken(authHeader);
  }

  // Run the ViewerContext with the loaded viewer
  ViewerContext.run(viewer, () => {
    next();
  });
});

// Example route handler
app.get('/', async (req, res) => {
  const user = useViewer();
  await performAction(); // Example asynchronous operation

  if (user) {
    res.send(`Hello, ${user.name}!`);
  } else {
    res.send('Hello, Guest!');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

```

