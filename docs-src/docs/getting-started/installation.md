# Installation

ODIN runs on Windows, macOS, and Linux. No registration or account is required.

## Download

Get the latest release from the [GitHub Releases](https://github.com/syncpoint/ODINv2/releases) page.

### Windows

Download the `.exe` installer from the releases page. Run the installer and follow the prompts. Requires Windows 10 or later.

### macOS

Download the `.dmg` file from the releases page. Open the disk image and drag ODIN to your Applications folder. Requires macOS 10.15 (Catalina) or later.

### Linux

=== "Snap Store (recommended)"

    Install from the Snap Store for automatic updates:

    ```bash
    sudo snap install odin-v2
    ```

    [![Get it from the Snap Store](https://snapcraft.io/en/light/install.svg)](https://snapcraft.io/odin-v2)

=== "AppImage"

    Download the `.AppImage` file from the releases page:

    ```bash
    chmod +x ODIN-*.AppImage
    ./ODIN-*.AppImage
    ```

## First Launch

On first launch, ODIN creates a new empty project. You can immediately:

1. Add map tile services for background maps
2. Create layers and place military symbols
3. Draw shapes and annotations
4. Configure collaboration via Matrix

## Migrating from ODINv1

If you have an existing ODINv1 installation, ODIN v2 will automatically migrate all your projects on first start. You can continue using ODINv1 in parallel, but changes made in ODINv1 after the initial migration will not be synchronised.

To import individual ODINv1 layer files (`.json`), drag and drop them onto the ODIN v2 map at any time.

## Self-Update

ODIN checks for updates automatically. To disable self-update, set the environment variable:

```bash
ODIN_SELF_UPDATE=0
```
