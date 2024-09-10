import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as Location from 'expo-location'

interface RegionsState {
  regions: Location.LocationRegion[];
}

const initialState: RegionsState = {
  regions: [],
};

const regionsSlice = createSlice({
  name: 'regions',
  initialState,
  reducers: {
    setRegions(state, action: PayloadAction<Location.LocationRegion[]>) {
      state.regions = action.payload;
    },
    updateRegion(state, action: PayloadAction<Location.LocationRegion>) {
      const index = state.regions.findIndex(region => region.identifier === action.payload.identifier);
      if (index !== -1) {
        state.regions[index] = action.payload;
      }
    },
    addRegion(state, action: PayloadAction<Location.LocationRegion>) {
      state.regions.push(action.payload);
    },
    deleteRegion(state, action: PayloadAction<string>) {
      state.regions = state.regions.filter(region => region.identifier !== action.payload);
    },
  },
});

export const { setRegions, updateRegion, addRegion, deleteRegion } = regionsSlice.actions;

export default regionsSlice.reducer;