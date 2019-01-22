import React, { StatelessComponent } from "react";

import { PropTypesOf } from "talk-framework/types";
import { HorizontalGutter } from "talk-ui/components";

import AkismetConfigContainer from "../containers/AkismetConfigContainer";
import PerspectiveConfigContainer from "../containers/PerspectiveConfigContainer";

interface Props {
  disabled: boolean;
  settings: PropTypesOf<typeof AkismetConfigContainer>["settings"] &
    PropTypesOf<typeof PerspectiveConfigContainer>["settings"];
  onInitValues: (values: any) => void;
}

const Moderation: StatelessComponent<Props> = ({
  disabled,
  settings,
  onInitValues,
}) => (
  <HorizontalGutter size="double" data-testid="configure-settingsContainer">
    <PerspectiveConfigContainer
      disabled={disabled}
      settings={settings}
      onInitValues={onInitValues}
    />
    <AkismetConfigContainer
      disabled={disabled}
      settings={settings}
      onInitValues={onInitValues}
    />
  </HorizontalGutter>
);

export default Moderation;