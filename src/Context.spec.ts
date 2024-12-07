import express from 'express';
import createContext from './createContext';
import useContext from './useContext';
import Context from './Context';

type User = {
  id: string;
  name: string;
};

describe('Contexta', () => {
  let UserContext: Context<User | null>;

  beforeEach(() => {
    UserContext = createContext<User | null>(null);
  });

  test('should return default value when no context is run', () => {
    expect(useContext(UserContext)).toBeNull();
  });

  test('should provide the context value within run', () => {
    UserContext.run({ id: '1', name: 'Alice' }, () => {
      expect(useContext(UserContext)).toEqual({ id: '1', name: 'Alice' });
    });
  });

  test('should not affect context outside of run', () => {
    UserContext.run({ id: '2', name: 'Bob' }, () => {
      expect(useContext(UserContext)).toEqual({ id: '2', name: 'Bob' });
    });
    expect(useContext(UserContext)).toBeNull();
  });

  test('should handle multiple contexts correctly', () => {
    const RequestIdContext = createContext<string>('unknown-request');

    UserContext.run({ id: '6', name: 'Frank' }, () => {
      RequestIdContext.run('req-123', () => {
        expect(useContext(UserContext)).toEqual({ id: '6', name: 'Frank' });
        expect(useContext(RequestIdContext)).toBe('req-123');
      });

      expect(useContext(UserContext)).toEqual({ id: '6', name: 'Frank' });
      expect(useContext(RequestIdContext)).toBe('unknown-request');
    });
  });

  test('should handle nested contexts correctly', () => {
    const AuthContext = createContext<boolean>(false);

    UserContext.run({ id: '7', name: 'Grace' }, () => {
      AuthContext.run(true, () => {
        expect(useContext(UserContext)).toEqual({ id: '7', name: 'Grace' });
        expect(useContext(AuthContext)).toBe(true);
      });

      expect(useContext(UserContext)).toEqual({ id: '7', name: 'Grace' });
      expect(useContext(AuthContext)).toBe(false);
    });
  });

  test('should allow multiple run calls with different context instances', () => {
    const ThemeContext = createContext<string>('light');

    UserContext.run({ id: '8', name: 'Heidi' }, () => {
      ThemeContext.run('dark', () => {
        expect(useContext(UserContext)).toEqual({ id: '8', name: 'Heidi' });
        expect(useContext(ThemeContext)).toBe('dark');
      });

      expect(useContext(UserContext)).toEqual({ id: '8', name: 'Heidi' });
      expect(useContext(ThemeContext)).toBe('light');
    });
  });

  test('should maintain context across asynchronous operations', async () => {
    await UserContext.run({ id: '9', name: 'Ivan' }, async () => {
      expect(useContext(UserContext)).toEqual({ id: '9', name: 'Ivan' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(useContext(UserContext)).toEqual({ id: '9', name: 'Ivan' });
    });

    expect(useContext(UserContext)).toBeNull();
  });

  test('should not leak context between parallel runs', async () => {
    const results: Array<User | null> = [];

    async function runContext(user: User | null) {
      await UserContext.run(user, async () => {
        // Simulate asynchronous operation
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));
        results.push(useContext(UserContext));
      });
    };

    await Promise.all([
      runContext({ id: '10', name: 'Judy' }),
      runContext(null),
      runContext({ id: '11', name: 'Karl' }),
    ]);

    expect(results).toContainEqual({ id: '10', name: 'Judy' });
    expect(results).toContainEqual(null);
    expect(results).toContainEqual({ id: '11', name: 'Karl' });
  });

  test('should work with express middleware', async () => {
    const ViewerContext = createContext<User | null>(null);

    function useViewer() {
      return useContext(ViewerContext);
    }

    const app = express();

    app.use(async (req, _res, next) => {
      let viewer: User | null = null;
    
      if (req.query.name) {
        viewer = { id: '1', name: req.query.name as string };
      }
    
      ViewerContext.run(viewer, () => {
        return next();
      });
    });

    app.get('/', async (_req, res) => {
      const user = useViewer();

      if (user) {
        res.send(`Hello, ${user.name}!`);
      } else {
        res.send('Hello, Guest!');
      }
    });

    await new Promise((resolve) => {
      const server =app.listen(3000, async() => {
        const response = await fetch('http://localhost:3000/?name=John');
        expect(await response.text()).toBe('Hello, John!');

        const response2 = await fetch('http://localhost:3000/?name=Adam');
        expect(await response2.text()).toBe('Hello, Adam!');

        server.close();
    
        resolve(void 0);
      });
    });
  });
});
