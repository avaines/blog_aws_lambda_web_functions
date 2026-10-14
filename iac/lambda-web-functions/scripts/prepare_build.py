import shutil
import sys
from pathlib import Path

BUILD_INPUTS = (
    'app',
    'components',
    'lib',
    'public',
    'scripts',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'next.config.ts',
    'next-env.d.ts',
    'eslint.config.mjs',
)


def copy_build_inputs(source: Path, target: Path) -> None:
    for name in BUILD_INPUTS:
        item = source / name
        if item.is_dir():
            shutil.copytree(item, target / name)
        elif item.exists():
            shutil.copy2(item, target / name)


if __name__ == '__main__':
    copy_build_inputs(Path(sys.argv[1]), Path(sys.argv[2]))