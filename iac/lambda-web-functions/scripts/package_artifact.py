import sys
import zipfile
from pathlib import Path

REQUIRED_OUTPUTS = (
    'server.js',
    '.next/BUILD_ID',
    '.next/static',
    'node_modules/next',
)
MAX_UNCOMPRESSED_BYTES = 512 * 1024 * 1024


def package_standalone(source: Path, root: Path) -> Path:
    for item in REQUIRED_OUTPUTS:
        if not (source / item).exists():
            raise SystemExit(f'Missing standalone output: {item}')

    files = [path for path in source.rglob('*') if path.is_file()]
    uncompressed_size = sum(path.stat().st_size for path in files)
    if uncompressed_size >= MAX_UNCOMPRESSED_BYTES:
        raise SystemExit('Uncompressed package exceeds the 512 MiB limit')

    output = root / 'build/application.zip'
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, path.relative_to(source))
        archive.write(root / 'scripts/index.js', 'index.js')

    print(f'Created {output}')
    return output


if __name__ == '__main__':
    package_standalone(Path(sys.argv[1]), Path(sys.argv[2]))