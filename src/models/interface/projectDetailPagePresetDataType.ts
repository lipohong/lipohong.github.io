interface ProjectDetailPagePresetDataType {
  [key: string]: {
    header: {
      name: string;
      description: string;
      address: string;
      images: {
        [key: string]: any;
      }
    },
    features: {
      header: string;
      main: string;
      image: {
        [key: string]: any;
      }
    }[],
    stacks: {
      header: string;
      items: string[];
    }[],
    links: {
      icon: any;
      content: string;
      address: string;
    }[]
  }
};

export default ProjectDetailPagePresetDataType