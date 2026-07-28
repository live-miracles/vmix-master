import concurrently from 'concurrently';
import { execa } from 'execa';

await execa('npm', ['run', 'build'], { stdio: 'inherit' });

const { result } = concurrently(
    [
        {
            name: 'ts',
            command: 'tsc -p tsconfig.app.json --watch --preserveWatchOutput',
        },
        {
            name: 'css',
            command: 'tailwindcss -i ./public/input.css -o ./public/output.css --watch',
        },
        {
            name: 'server',
            command: 'serve public --listen 3000',
        },
    ],
    {
        killOthersOn: ['failure', 'success'],
        prefix: 'name',
    },
);

await result;
