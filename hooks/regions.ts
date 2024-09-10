import { useSelector } from "react-redux"
import { RootState } from "../store/store"
import { useDispatch } from 'react-redux';
import { addRegion, updateRegion, deleteRegion, setRegions } from '../store/regionsSlice';
import * as Location from 'expo-location'

export const useRegions = () => {
  return useSelector((state: RootState) => state.regions.regions)
}

export const useRegionsActions = () => {
  const dispatch = useDispatch();

  const dispatchSetRegions = (regions: Location.LocationRegion[]) => {
    dispatch(setRegions(regions));
  };

  const dispatchAddRegion = (region: Location.LocationRegion) => {
    dispatch(addRegion(region));
  };

  const dispatchUpdateRegion = (region: Location.LocationRegion) => {
    dispatch(updateRegion(region));
  };

  const dispatchDeleteRegion = (identifier: string) => {
    dispatch(deleteRegion(identifier));
  };

  return {
    dispatchSetRegions,
    dispatchAddRegion,
    dispatchUpdateRegion,
    dispatchDeleteRegion,
  };
};