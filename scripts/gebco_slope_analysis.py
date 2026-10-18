import os
import matplotlib.pyplot as plt
import rasterio

# Define file paths
tif_path = os.path.join("figures", "shoreline_retreat_2016_2024.tif")
output_png_path = os.path.join("figures", "shoreline_retreat_2016_2024.png")

if os.path.exists(tif_path):
    with rasterio.open(tif_path) as src:
        # Read raster image data
        img = src.read()
        
        fig, ax = plt.subplots(figsize=(10, 8), dpi=300)
        
        if img.shape[0] >= 3:
            # Display RGB channels directly
            rgb = img[:3].transpose(1, 2, 0)
            ax.imshow(rgb)
        else:
            # Display as a single-band mask
            ax.imshow(img[0], cmap='Blues')
            
        ax.set_title('Qizilagac Bay Shoreline Retreat (2016-2024)', fontsize=12, fontweight='bold')
        ax.set_xlabel('Grid Pixels (X)')
        ax.set_ylabel('Grid Pixels (Y)')
        
        plt.tight_layout()
        plt.savefig(output_png_path, dpi=300)
        plt.show()
        print(f"Map successfully saved to: {output_png_path}")
else:
    print(f"Error: File not found at {tif_path}")