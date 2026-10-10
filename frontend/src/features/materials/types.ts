export type MaterialListItem = {
  id: string;
  title: string;
  fileName: string;
  contentType: string;
  byteSize: number;
  moduleId: string | null;
  createdAt: string;
  downloadUrl: string;
  createdBy: {
    id: string;
    fullName: string;
  };
};
