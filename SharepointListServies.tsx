/* eslint-disable @typescript-eslint/no-explicit-any */
import { sp } from "@pnp/sp/presets/all";
// import * as c from "../sicllist/urlList";

export async function getSharePointItems(siteUrl: string, listName: string): Promise<any[]> {
    try {
           sp.setup({
      sp: {
        baseUrl: siteUrl,
      },
    });
        const items: any[] = await sp.web.lists.getByTitle(listName).items.getAll();
        console.log(`Items fetched from ${listName} SharePoint list:`, items);
        return items;
    } catch (error) {
        console.error("Error fetching SharePoint items:", error);
        throw error;
    }
}

export async function submitProductToSharePoint(
  siteUrl: string,
  listName: string,
  metadata: any,
  file?: File,
  folderpathName?: string
): Promise<number> {
  try {
    sp.setup({
      sp: {
        baseUrl: siteUrl,
      },
    });

    // Add a new item to the SharePoint list
    const addResult = await sp.web.lists.getByTitle(listName).items.add(metadata);
    console.log("List item created successfully with metadata.");

    const itemId = addResult.data.Id; // Get the newly created item's ID

    // If a file is provided, upload it to the specific folder
    if (file) {
      // Use correct server-relative path for EngineeringDrawing or Specfication
      // Example: "/sites/AppDev/AMS/ArtworkLibrary/EngineeringDrawing"
      // const folderPath = folderpathName; // or Specfication as needed
      try {
        if (!folderpathName) {
          throw new Error("Folder path is undefined. Cannot upload file.");
        }
        const uploadResult = await sp.web
          .getFolderByServerRelativeUrl(folderpathName)
          .files.add(file.name, file, true);
        console.log(`${file.name} uploaded successfully to ${folderpathName}`);

        // Update the file's metadata with the generated ID
        const fileItem = await uploadResult.file.getItem();
        await fileItem.update({
          DocID: itemId.toString(), // Ensure DocID is set as a string
        });

        // Verify the metadata update
        const updatedFileItem = await fileItem.get();
        console.log("Updated file metadata:", updatedFileItem);

        // Return only the itemId to match the function's return type
        return itemId;
      } catch (uploadError) {
        console.error("Error uploading file:", uploadError);
        throw new Error("File upload failed. Please check the folder path and permissions.");
      }
    }

    return itemId; // Return the item ID (if no file)
  } catch (error) {
    console.error("Error in submitProductToSharePoint:", error);
    throw error;
  }
}

export async function updateSharePointItem(
  siteUrl: string,
  listName: string,
  itemId: number,
  metadata: any
): Promise<void> {
  try {
    sp.setup({
      sp: {
        baseUrl: siteUrl,
      },
    });

    // Update the existing item in the SharePoint list
    await sp.web.lists.getByTitle(listName).items.getById(itemId).update(metadata);
    console.log(`Item with ID ${itemId} updated successfully in ${listName} list.`);
  } catch (error) {
    console.error("Error updating SharePoint item:", error);
    throw error;
  }
}

export async function uploadFileToSharePoint(
  siteUrl: string,
  folderPath: string,
  file: File,
  itemId: number
): Promise<void> {
  try {
    sp.setup({
      sp: {
        baseUrl: siteUrl,
      },
    });

    // Ensure folderPath is server-relative (starts with /sites/...)
    const serverRelativeFolderPath = folderPath.startsWith("/")
      ? folderPath
      : `/sites/AppDev/AMS/${folderPath}`;

    // Upload the file to the specified folder
    const uploadResult = await sp.web.getFolderByServerRelativeUrl(serverRelativeFolderPath).files.add(file.name, file, true);
    console.log(`${file.name} uploaded successfully to ${folderPath}`);

    // Update the file's metadata with the provided DocID
    const fileItem = await uploadResult.file.getItem();
    await fileItem.update({
      DocID: itemId.toString(), // Ensure DocID is set as a string
    });

    console.log(`DocID updated for ${file.name} with ID ${itemId}`);
  } catch (error) {
    console.error("Error uploading file to SharePoint:", error);
    throw error;
  }
}

export async function fetchFilesFromFolder(
  siteUrl: string,
  folderPath: string,
  docId: number
): Promise<any[]> {
  try {
    sp.setup({
      sp: {
        baseUrl: siteUrl,
      },
    });

    // Ensure folderPath is server-relative (starts with /sites/...)
    const serverRelativeFolderPath = folderPath.startsWith("/")
      ? folderPath
      : `/sites/AppDev/AMS/ArtworkLibrary/${folderPath}`;

    // Fetch files from the specified folder with the matching DocID
    const files = await sp.web
      .getFolderByServerRelativeUrl(serverRelativeFolderPath)
      .files.select("Name", "ServerRelativeUrl", "UniqueId", "ListItemAllFields/DocID")
      .expand("ListItemAllFields")
      .filter(`ListItemAllFields/DocID eq ${docId}`) // Filter by DocID
      .get();

    console.log(`Files fetched from ${folderPath}:`, files);
    return files;
  } catch (error) {
    console.error("Error fetching files from folder:", error);
    throw error;
  }
}



